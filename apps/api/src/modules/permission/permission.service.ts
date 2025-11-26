/**
 * @module Permission Service
 * @description Business logic for permission management
 */

import { db } from '@workspace/database'
import {
	CreatePermissionDto,
	UpdatePermissionDto,
	PermissionListQuery,
	PermissionListResponse,
	Permission,
	GeneratedPermissionPreview,
	PermissionSummarySet,
	PermissionSummaryModule,
	PermissionSummaryGroup,
} from './permission.types'
import { NotFoundError, ConflictError } from '../../shared/utils/error.util'
import { getAllRoutes } from '../../shared/utils/route.util'
import { deriveModule, deriveAction, composeMetaName, isModuleAllowed } from '../../shared/utils/permission.util'
import { AuthenticatedRequest } from '@workspace/types'
import { logActivity } from '../../shared/utils/activity_log.util'
import { ActivityAction } from '../activity_log/activity_log.types'
import app from '../../app'
import { config } from '../../../../../packages/config'

const permissionDelegate = db.permission as any
const ADMIN_PREFIX = config.api.adminPrefix
const MEMBER_PREFIX = config.api.memberPrefix

const formatLabel = (value: string): string => {
	return value
		.replace(/[_\-]+/g, ' ')
		.split(' ')
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(' ')
}

const ORDER =
	['view', 'add', 'edit', 'delete']

const actionSortKey = (value: string): string => {
	const lower = value.toLowerCase()
	const index = ORDER.indexOf(lower)
	if (index >= 0) {
		return `${index}-${lower}`
	}
	return `99-${lower}`
}

export class PermissionService {
	/**
	 * Find all permissions with pagination and filters
	 */
	async findAll(query: PermissionListQuery): Promise<PermissionListResponse> {
		const {
			page = 1,
			limit = 10,
			search,
			scope,
			module,
			method,
			action,
			type,
			group,
			metaName,
			isActive,
			sortBy = 'module',
			sortOrder = 'asc',
		} = query

		const skip = (page - 1) * limit

		const where: any = {}

		if (search) {
			where.OR = [
				{ path: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } },
				{ metaName: { contains: search, mode: 'insensitive' } },
				{ action: { contains: search, mode: 'insensitive' } },
				{ type: { contains: search, mode: 'insensitive' } },
				{ group: { contains: search, mode: 'insensitive' } },
			]
		}

		if (scope) where.scope = scope
		if (module) where.module = module
		if (method) where.method = method
		if (action) where.action = action
		if (type) where.type = type
		if (group) where.group = group
		if (metaName) where.metaName = metaName
		if (isActive !== undefined) where.isActive = isActive

		const total = await permissionDelegate.count({ where })

		const permissions = await permissionDelegate.findMany({
			where,
			skip,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
		})

		return {
			data: permissions as any,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		}
	}

	/**
	 * Find permission by ID
	 */
	async findById(id: number): Promise<Permission> {
		const permission = await permissionDelegate.findUnique({ where: { id } })
		if (!permission) throw new NotFoundError('Permission not found')
		return permission as any
	}

	/**
	 * Create a new permission
	 * 
	 * @param data - Permission creation data
	 * @param req - Optional authenticated request for logging
	 */
	async create(data: CreatePermissionDto, req?: AuthenticatedRequest | null): Promise<Permission> {
		const existing = await permissionDelegate.findUnique({
			where: { method_path: { method: data.method, path: data.path } },
		})
		if (existing) throw new ConflictError(`Permission for ${data.method} ${data.path} already exists`)

		const existingMeta = await permissionDelegate.findUnique({
			where: { metaName: data.metaName },
		})
		if (existingMeta) throw new ConflictError(`Permission for ${data.metaName} already exists`)

		const permission = await permissionDelegate.create({
			data: {
				method: data.method,
				action: data.action,
				type: data.type,
				path: data.path,
				module: data.module,
				group: data.group,
				metaName: data.metaName,
				description: data.description,
				isActive: data.isActive ?? true,
			},
		})

		const result = permission as any
		// Log activity
		await logActivity(req || null, ActivityAction.CREATE, 'Permission', result.id.toString(), null, result)
		return result
	}

	/**
	 * Update permission
	 * 
	 * @param id - Permission ID
	 * @param data - Permission update data
	 * @param req - Optional authenticated request for logging
	 */
	async update(id: number, data: UpdatePermissionDto, req?: AuthenticatedRequest | null): Promise<Permission> {
		// Get old data for logging
		const oldPermission = await this.findById(id).catch(() => null)
		
		const existingPermission = await permissionDelegate.findUnique({ where: { id } })
		if (!existingPermission) throw new NotFoundError('Permission not found')

		if (data.method || data.path) {
			const method = data.method || existingPermission.method
			const path = data.path || existingPermission.path

			const conflict = await permissionDelegate.findFirst({
				where: { method, path, id: { not: id } },
			})

			if (conflict) throw new ConflictError(`Permission for ${method} ${path} already exists`)
		}

		if (data.metaName) {
			const conflictMeta = await permissionDelegate.findUnique({ where: { metaName: data.metaName } })
			if (conflictMeta && conflictMeta.id !== id) {
				throw new ConflictError(`Permission for ${data.metaName} already exists`)
			}
		}

		const permission = await permissionDelegate.update({
			where: { id },
			data: {
				method: data.method,
				action: data.action,
				type: data.type,
				path: data.path,
				module: data.module,
				group: data.group,
				metaName: data.metaName,
				description: data.description,
				isActive: data.isActive,
			},
		})

		const result = permission as any
		// Log activity
		if (oldPermission) {
			await logActivity(req || null, ActivityAction.UPDATE, 'Permission', id.toString(), oldPermission, result)
		}
		return result
	}

	/**
	 * Toggle permission status
	 * 
	 * @param id - Permission ID
	 * @param req - Optional authenticated request for logging
	 */
	async updateStatus(id: number, req?: AuthenticatedRequest | null): Promise<Permission> {
		// Get old data for logging
		const oldPermission = await this.findById(id).catch(() => null)
		
		const permission = await permissionDelegate.findUnique({ where: { id } })
		if (!permission) throw new NotFoundError('Permission not found')

		const updated = await permissionDelegate.update({
			where: { id },
			data: { isActive: !permission.isActive },
		})

		const result = updated as any
		// Log activity
		if (oldPermission) {
			await logActivity(req || null, ActivityAction.UPDATE, 'Permission', id.toString(), oldPermission, result)
		}
		return result
	}

	/**
	 * Delete permission
	 * 
	 * @param id - Permission ID
	 * @param req - Optional authenticated request for logging
	 */
	async delete(id: number, req?: AuthenticatedRequest | null): Promise<void> {
		// Get old data for logging
		const oldPermission = await this.findById(id).catch(() => null)
		
		const permission = await permissionDelegate.findUnique({ where: { id } })
		if (!permission) throw new NotFoundError('Permission not found')

		await permissionDelegate.delete({ where: { id } })

		// Log activity
		if (oldPermission) {
			await logActivity(req || null, ActivityAction.DELETE, 'Permission', id.toString(), oldPermission, null)
		}
	}

	/**
	 * Get unique modules list
	 */
	async getModules(): Promise<string[]> {
		const permissions = await permissionDelegate.findMany({
			select: { module: true },
			distinct: ['module'],
			orderBy: { module: 'asc' },
		})

		return permissions.map((permission: { module: string }) => permission.module)
	}

	/**
	 * Get unique groups list
	 */
	async getGroups(): Promise<string[]> {
		const permissions = await permissionDelegate.findMany({
			select: { group: true },
			distinct: ['group'],
			orderBy: { group: 'asc' },
		})

		return permissions.map((permission: { group: string }) => permission.group)
	}

	/**
	 * Get current user's permissions (metaNames)
	 * @param roleId - User's role ID
	 * @param scope - Scope to filter permissions (admin/member/public)
	 * @returns Array of permission metaNames
	 */
	async getUserPermissions(roleId: number, scope: string): Promise<string[]> {
		// Check if super admin (roleId === 1)
		if (roleId === 1) {
			// Super admin has all permissions - return empty array (bypass check)
			return []
		}

		// Get role permissions
		const rolePermissions = await db.rolePermission.findMany({
			where: {
				roleId,
				permission: {
					scope,
					isActive: true,
				},
			},
			include: {
				permission: true,
			},
		})

		// Extract metaNames
		const metaNames = rolePermissions
			.filter((rp) => rp.permission !== null)
			.map((rp) => rp.permission.metaName)

		return metaNames
	}

	/**
	 * Get permissions grouped by type, module, and group for a given scope
	 */
	async getGroupedByScope(scope: string, type?: string | null): Promise<PermissionSummarySet[]> {
		const where: Record<string, unknown> = {
			scope,
			isActive: true,
		}

		if (type !== undefined) {
			where.type = type
		}

		const permissions = await permissionDelegate.findMany({
			where,
			orderBy: [
				{ type: 'asc' },
				{ module: 'asc' },
				{ group: 'asc' },
				{ action: 'asc' },
			],
			select: {
				id: true,
				type: true,
				module: true,
				group: true,
				action: true,
				metaName: true,
				description: true,
			},
		})

		const setsMap = new Map<string | null, Map<string, Map<string, PermissionSummaryGroup>>>()

		permissions.forEach((permission: any) => {
			const typeKey = (permission.type ?? null) as string | null
			const moduleKey = permission.module as string
			const groupKey = permission.group as string

			if (!setsMap.has(typeKey)) {
				setsMap.set(typeKey, new Map())
			}
			const moduleMap = setsMap.get(typeKey)!

			if (!moduleMap.has(moduleKey)) {
				moduleMap.set(moduleKey, new Map())
			}
			const groupMap = moduleMap.get(moduleKey)!

			if (!groupMap.has(groupKey)) {
				groupMap.set(groupKey, {
					key: groupKey,
					label: formatLabel(groupKey),
					actionIds: [],
					actions: [],
				})
			}

			const groupEntry = groupMap.get(groupKey)!
			groupEntry.actionIds.push(permission.id)
			groupEntry.actions.push({
				id: permission.id,
				action: permission.action,
				metaName: permission.metaName,
				description: permission.description,
			})
		})

	const sets: PermissionSummarySet[] = Array.from(setsMap.entries())
			.sort(([a], [b]) => {
				const valueA = a ?? ''
				const valueB = b ?? ''
				return valueA.localeCompare(valueB)
			})
			.map(([typeKey, moduleMap]) => {
				const modules: PermissionSummaryModule[] = Array.from(moduleMap.entries())
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([moduleKey, groupMap]) => {
						const groups: PermissionSummaryGroup[] = Array.from(groupMap.values())
							.sort((a, b) => actionSortKey(a.key).localeCompare(actionSortKey(b.key)))
							.map((group) => ({
								key: group.key,
								label: group.label,
								actionIds: [...group.actionIds],
								actions: [...group.actions].sort((a, b) =>
									actionSortKey(a.action).localeCompare(actionSortKey(b.action)),
								),
							}))

						return {
							key: moduleKey,
							label: formatLabel(moduleKey),
							groups,
						}
					})

				return {
					type: typeKey,
					modules,
				}
			})

		return sets
	}

	/**
	 * Get all routes from Express app
	 */
	async generatePermissions(): Promise<GeneratedPermissionPreview[]> {
		if (!app._router) throw new Error('Express router not initialized')

		const previews: GeneratedPermissionPreview[] = []
		const shouldPersist = true

		// Define prefixes with their scopes
		const prefixes = [
			{ prefix: ADMIN_PREFIX, scope: 'admin' },
			{ prefix: MEMBER_PREFIX, scope: 'member' },
			// PUBLIC_PREFIX is skipped - no permissions needed for public routes
		]

		if (shouldPersist) {
			// Deactivate all existing permissions
			await permissionDelegate.updateMany({
				data: { isActive: false },
			})
		}

		const processedMetaNames = new Set<string>()

		// Process each scope
		for (const { prefix, scope } of prefixes) {
			const routes = getAllRoutes(app._router.stack, prefix)

			for (const route of routes) {
				for (const method of route.methods) {
					const methodLower = method.toLowerCase()
					const meta = route.meta
					if (!meta) continue
					const moduleName = meta?.module ?? deriveModule(route.path)
					if (!isModuleAllowed(moduleName)) continue
					const types = meta?.types?.length ? meta.types : [undefined]
					const groupValue = meta?.group ?? 'default'
					const actionValue = meta?.action ?? deriveAction(route.path, methodLower)

					for (const type of types) {
						const metaName = meta?.metaName ?? composeMetaName(moduleName, type, groupValue, actionValue)

						// Use scope+metaName to avoid collision
						const scopedKey = `${scope}:${metaName}`
						if (processedMetaNames.has(scopedKey)) continue
						processedMetaNames.add(scopedKey)

						const resolvedPath = route.path
						const autoDescription = [type, actionValue].filter(Boolean).join(' ') || actionValue
						const description = meta?.description ?? autoDescription

						previews.push({
							scope,
							module: moduleName,
							method,
							action: actionValue,
							group: groupValue,
							type,
							metaName,
							path: resolvedPath,
							description,
							basePath: route.path,
							paramType: type,
						})

						if (shouldPersist) {
							try {
								// Try to find existing permission by scope and metaName
								const existing = await permissionDelegate.findFirst({
									where: {
										scope,
										metaName,
									},
								})

								if (existing) {
									await permissionDelegate.update({
										where: { id: existing.id },
										data: {
											scope,
											path: resolvedPath,
											module: moduleName,
											method,
											action: actionValue,
											group: groupValue,
											type: type || null,
											metaName,
											description,
											isActive: true,
										},
									})
								} else {
									await permissionDelegate.create({
										data: {
											scope,
											path: resolvedPath,
											module: moduleName,
											method,
											action: actionValue,
											group: groupValue,
											type: type || null,
											metaName,
											description,
											isActive: true,
										},
									})
								}
							} catch (error: any) {
								console.error('Error saving permission:', {
									scope,
									metaName,
									path: resolvedPath,
									module: moduleName,
									error: error.message,
									code: error.code,
								})
								// Continue processing other permissions even if one fails
							}
						}
					}
				}
			}
		}

		console.log('🔍 Generated permission previews:', JSON.stringify(previews, null, 2))

		if (shouldPersist) {
			await permissionDelegate.deleteMany({
				where: { isActive: false },
			})
		}

		return previews
	}
}


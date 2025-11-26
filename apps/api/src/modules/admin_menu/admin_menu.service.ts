/**
 * @module Admin Menu Service
 * @description Business logic for admin menu management
 */

import { db } from '@workspace/database'
import {
	CreateAdminMenuDto,
	UpdateAdminMenuDto,
	AdminMenuListQuery,
	AdminMenuListResponse,
	AdminMenu,
	AdminMenuTreeItem,
	AdminMenuReorderEntry,
} from './admin_menu.types'
import { NotFoundError, ConflictError } from '../../shared/utils/error.util'
import { AuthenticatedRequest } from '@workspace/types'
import { logActivity } from '../../shared/utils/activity_log.util'
import { ActivityAction } from '../activity_log/activity_log.types'

export class AdminMenuService {
	/**
	 * Find all menu items with pagination and filters
	 */
	async findAll(query: AdminMenuListQuery): Promise<AdminMenuListResponse> {
		const {
			page = 1,
			limit = 100,
			search,
			module,
			type,
			status,
			parentId,
			sortBy = 'sequence',
			sortOrder = 'asc',
		} = query

		const skip = (page - 1) * limit

		const where: any = {}

		if (search) {
			where.OR = [
				{ path: { contains: search, mode: 'insensitive' } },
				{ module: { contains: search, mode: 'insensitive' } },
				{
					translates: {
						some: {
							name: { contains: search, mode: 'insensitive' },
						},
					},
				},
			]
		}

		if (module) where.module = module
		if (type !== undefined) {
			if (type === null || type === '') {
				where.type = null
			} else {
				where.type = type
			}
		}
		if (status !== undefined) where.status = status

		if (parentId !== undefined) {
			const hierarchyNodes = await db.adminMenu.findMany({
				select: { id: true, parentId: true },
			})

			const childrenMap = new Map<number | null, number[]>()
			for (const node of hierarchyNodes) {
				const key = node.parentId ?? null
				if (!childrenMap.has(key)) {
					childrenMap.set(key, [])
				}
				childrenMap.get(key)!.push(node.id)
			}

			const collectDescendants = (start: number | null): number[] => {
				const stack = [...(childrenMap.get(start) ?? [])]
				const collected: number[] = []
				while (stack.length > 0) {
					const currentId = stack.pop()!
					collected.push(currentId)
					const childIds = childrenMap.get(currentId)
					if (childIds && childIds.length > 0) {
						stack.push(...childIds)
					}
				}
				return collected
			}

			const descendantIds =
				parentId === null || parentId === 0
					? childrenMap.get(null)?.slice() ?? []
					: collectDescendants(parentId)

			if (descendantIds.length === 0) {
				return {
					data: [],
					pagination: {
						page,
						limit,
						total: 0,
						totalPages: 0,
					},
				}
			}

			where.id = { in: descendantIds }
		}

		const total = await db.adminMenu.count({ where })

		const ancestry = await db.adminMenu.findMany({
			where,
			select: { id: true, parentId: true },
		})

		const parentMap = new Map<number, number | null>()
		ancestry.forEach((entry) => parentMap.set(entry.id, entry.parentId ?? null))

		const levelCache = new Map<number, number>()
		const resolveLevel = (id: number, visited: Set<number> = new Set()): number => {
			if (levelCache.has(id)) return levelCache.get(id)!
			if (visited.has(id)) return 0
			visited.add(id)
			const parentId = parentMap.get(id)
			if (parentId === null || parentId === undefined) {
				levelCache.set(id, 0)
				return 0
			}
			const level = resolveLevel(parentId, visited) + 1
			levelCache.set(id, level)
			return level
		}

		const allowedColumns = new Set([
			'id',
			'icon',
			'path',
			'parentId',
			'sequence',
			'module',
			'type',
			'group',
			'status',
			'createdAt',
			'updatedAt',
		])

		let menusWithLevel
		if (sortBy === 'name') {
			const allMenus = await db.adminMenu.findMany({
				where,
				include: {
					children: true,
					parent: {
						select: {
							id: true,
							translates: {
								select: {
									lang: true,
									name: true,
								},
							},
						},
					},
					translates: true,
				},
			})

			const collator = new Intl.Collator('th', { sensitivity: 'base', usage: 'sort' })
			const getDisplayName = (menu: any) => {
				const preferred = menu.translates?.find((tr: any) => tr.lang === 'th') ?? menu.translates?.[0]
				const name = preferred?.name ?? ''
				return name || ''
			}

			const sortedMenus = allMenus.sort((a, b) => {
				const aName = getDisplayName(a)
				const bName = getDisplayName(b)
				const compare = collator.compare(aName, bName)
				return sortOrder === 'desc' ? -compare : compare
			})

			const paginatedMenus = sortedMenus.slice(skip, skip + limit)

			menusWithLevel = paginatedMenus.map((menu) => ({
				...menu,
				level: resolveLevel(menu.id),
				parent: menu.parent
					? {
							id: menu.parent.id,
							translates: menu.parent.translates ?? [],
					  }
					: null,
			}))
		} else {
			const effectiveSortBy = allowedColumns.has(sortBy) ? sortBy : 'sequence'

			const menus = await db.adminMenu.findMany({
				where,
				skip,
				take: limit,
				orderBy: { [effectiveSortBy]: sortOrder },
				include: {
					children: true,
					parent: {
						select: {
							id: true,
							translates: {
								select: {
									lang: true,
									name: true,
								},
							},
						},
					},
					translates: true,
				},
			})

			menusWithLevel = menus.map((menu) => ({
				...menu,
				level: resolveLevel(menu.id),
				parent: menu.parent
					? {
							id: menu.parent.id,
							translates: menu.parent.translates ?? [],
					  }
					: null,
			}))
		}

		return {
			data: menusWithLevel as any,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		}
	}

	/**
	 * Find menu item by ID
	 */
	async findById(id: number): Promise<AdminMenu> {
		const menu = await db.adminMenu.findUnique({
			where: { id },
			include: {
				children: true,
				parent: true,
				translates: true,
			},
		})

		if (!menu) {
			throw new NotFoundError('Menu item not found')
		}

		return menu as any
	}

	/**
	 * Get menu items as tree structure
	 */
	async getTree(userRoleId?: number, isSuperAdmin: boolean = false): Promise<AdminMenuTreeItem[]> {
		// Get all active menu items
		const menus = await db.adminMenu.findMany({
			where: { status: true },
			orderBy: [{ parentId: 'asc' }, { sequence: 'asc' }],
			include: {
				translates: true,
			},
		})

		// If super admin, return all menus
		if (isSuperAdmin) {
			return this.buildTree(menus as any)
		}

		// Get user's permissions
		if (!userRoleId) {
			return []
		}

		const rolePermissions = await db.rolePermission.findMany({
			where: { roleId: userRoleId },
			include: { permission: true },
		})

		const userPermissions = new Set(
			rolePermissions.map((rp) => rp.permission.metaName)
		)

		// Filter menus based on permissions
		const filteredMenus = menus.filter((menu) => {
			// If menu has module + type + group, check permission
			if (menu.module && menu.group) {
				// Build permission metaName: module.type.group.action
				// We need to find permission that matches module, type, and group
				const permissionMetaName = [menu.module, menu.type, menu.group, 'get_data']
					.filter(Boolean)
					.join('.')

				return userPermissions.has(permissionMetaName)
			}

			// If no module/group, show it (manual menu items)
			return true
		})

		return this.buildTree(filteredMenus as any)
	}

	/**
	 * Get full menu tree for management (includes inactive items)
	 */
	async getManagementTree(): Promise<AdminMenuTreeItem[]> {
		const menus = await db.adminMenu.findMany({
			orderBy: [{ parentId: 'asc' }, { sequence: 'asc' }],
			include: {
				translates: true,
			},
		})

		return this.buildTree(menus as any)
	}

	/**
	 * Reorder menu tree (updates parent relation and sequence)
	 */
	async reorderTree(entries: AdminMenuReorderEntry[]): Promise<void> {
		const allMenus = await db.adminMenu.findMany({
			select: { id: true },
		})

		const allIds = new Set(allMenus.map((menu) => menu.id))
		const visited = new Set<number>()

		entries.forEach((entry) => {
			if (!allIds.has(entry.id)) {
				throw new NotFoundError(`Menu item with id ${entry.id} not found`)
			}
			if (visited.has(entry.id)) {
				throw new ConflictError(`Duplicate menu id ${entry.id} in payload`)
			}
			visited.add(entry.id)
		})

		if (visited.size !== allIds.size) {
			throw new ConflictError('Tree payload must include all menu items')
		}

		await db.$transaction(
			entries.map(({ id, parentId, sequence }) =>
				db.adminMenu.update({
					where: { id },
					data: {
						parentId,
						sequence,
					},
				}),
			),
		)
	}

	/**
	 * Build tree structure from flat array
	 */
	private buildTree(menus: AdminMenu[]): AdminMenuTreeItem[] {
		const menuMap = new Map<number, AdminMenuTreeItem>()
		const rootMenus: AdminMenuTreeItem[] = []

		// Create map of all menus
		menus.forEach((menu) => {
			menuMap.set(menu.id, { ...menu, children: [] })
		})

		// Build tree
		menus.forEach((menu) => {
			const menuItem = menuMap.get(menu.id)!
			if (menu.parentId && menuMap.has(menu.parentId)) {
				const parent = menuMap.get(menu.parentId)!
				if (!parent.children) {
					parent.children = []
				}
				parent.children.push(menuItem)
			} else {
				rootMenus.push(menuItem)
			}
		})

		return rootMenus
	}

	/**
	 * Create new menu item
	 * 
	 * @param data - Menu creation data
	 * @param req - Optional authenticated request for logging
	 */
	async create(data: CreateAdminMenuDto, req?: AuthenticatedRequest | null): Promise<AdminMenu> {
		try {
			const { translates, ...menuData } = data

			// Auto-generate path if not provided
			let path = menuData.path
			if (!path && menuData.module) {
				if (menuData.type) {
					path = `/admin/${menuData.module}/${menuData.type}`
				} else {
					path = `/admin/${menuData.module}`
				}
			}

			// Get next sequence if not provided
			let sequence = menuData.sequence
			if (sequence === undefined) {
				const maxSequence = await db.adminMenu.findFirst({
					where: { parentId: menuData.parentId ?? null },
					orderBy: { sequence: 'desc' },
					select: { sequence: true },
				})
				sequence = (maxSequence?.sequence ?? 0) + 1
			}

			// Validate parent exists
			if (menuData.parentId) {
				const parent = await db.adminMenu.findUnique({
					where: { id: menuData.parentId },
				})
				if (!parent) {
					throw new NotFoundError('Parent menu not found')
				}
			}

			const menu = await db.adminMenu.create({
				data: {
					...menuData,
					path,
					sequence,
					translates: {
						create: translates.map((translate) => ({
							lang: translate.lang,
							name: translate.name || null,
						})),
					},
				},
				include: {
					children: true,
					parent: true,
					translates: true,
				},
			})

			const result = menu as any
			// Log activity
			await logActivity(req || null, ActivityAction.CREATE, 'AdminMenu', result.id.toString(), null, result)
			return result
		} catch (error) {
			throw error
		}
	}

	/**
	 * Update menu item
	 * 
	 * @param id - Menu ID
	 * @param data - Menu update data
	 * @param req - Optional authenticated request for logging
	 */
	async update(id: number, data: UpdateAdminMenuDto, req?: AuthenticatedRequest | null): Promise<AdminMenu> {
		// Get old data for logging
		const oldMenu = await this.findById(id).catch(() => null)
		
		const existing = await db.adminMenu.findUnique({ where: { id } })
		if (!existing) {
			throw new NotFoundError('Menu item not found')
		}

		const { translates, ...menuData } = data

		// Prevent circular reference
		if (menuData.parentId === id) {
			throw new ConflictError('Cannot set menu as its own parent')
		}

		// Check if parent is a descendant
		if (menuData.parentId) {
			const isDescendant = await this.isDescendant(id, menuData.parentId)
			if (isDescendant) {
				throw new ConflictError('Cannot set descendant as parent')
			}
		}

		// Auto-generate path if module changed and path not provided
		let path = menuData.path
		if (path === undefined && menuData.module !== undefined) {
			if (menuData.type !== undefined) {
				path = menuData.type ? `/admin/${menuData.module}/${menuData.type}` : `/admin/${menuData.module}`
			} else if (existing.type) {
				path = `/admin/${menuData.module}/${existing.type}`
			} else {
				path = `/admin/${menuData.module}`
			}
		}

		const menu = await db.adminMenu.update({
			where: { id },
			data: {
				...menuData,
				...(path !== undefined && { path }),
				...(translates && {
					translates: {
						deleteMany: {}, // Delete existing translations
						create: translates.map((translate) => ({
							lang: translate.lang,
							name: translate.name || null,
						})),
					},
				}),
			},
			include: {
				children: true,
				parent: true,
				translates: true,
			},
		})

		const result = menu as any
		// Log activity
		if (oldMenu) {
			await logActivity(req || null, ActivityAction.UPDATE, 'AdminMenu', id.toString(), oldMenu, result)
		}
		return result
	}

	/**
	 * Check if targetId is a descendant of menuId
	 */
	private async isDescendant(menuId: number, targetId: number): Promise<boolean> {
		const children = await db.adminMenu.findMany({
			where: { parentId: menuId },
			select: { id: true },
		})

		for (const child of children) {
			if (child.id === targetId) {
				return true
			}
			if (await this.isDescendant(child.id, targetId)) {
				return true
			}
		}

		return false
	}

	/**
	 * Delete menu item
	 * 
	 * @param id - Menu ID
	 * @param req - Optional authenticated request for logging
	 */
	async delete(id: number, req?: AuthenticatedRequest | null): Promise<void> {
		// Get old data for logging
		const oldMenu = await this.findById(id).catch(() => null)
		
		const menu = await db.adminMenu.findUnique({
			where: { id },
			include: { children: true },
		})

		if (!menu) {
			throw new NotFoundError('Menu item not found')
		}

		// If has children, set them to null parent
		if (menu.children && menu.children.length > 0) {
			await db.adminMenu.updateMany({
				where: { parentId: id },
				data: { parentId: null },
			})
		}

		await db.adminMenu.delete({ where: { id } })

		// Log activity
		if (oldMenu) {
			await logActivity(req || null, ActivityAction.DELETE, 'AdminMenu', id.toString(), oldMenu, null)
		}
	}

	/**
	 * Update sequence
	 */
	async updateSequence(id: number, sequence: number): Promise<AdminMenu> {
		const menu = await db.adminMenu.findUnique({ where: { id } })
		if (!menu) {
			throw new NotFoundError('Menu item not found')
		}

		return await db.adminMenu.update({
			where: { id },
			data: { sequence },
			include: {
				children: true,
				parent: true,
				translates: true,
			},
		}) as any
	}

	/**
	 * Move menu item up/down
	 */
	async moveSequence(id: number, action: 'up' | 'down'): Promise<AdminMenu> {
		const menu = await db.adminMenu.findUnique({ where: { id } })
		if (!menu) {
			throw new NotFoundError('Menu item not found')
		}

		const siblingMenus = await db.adminMenu.findMany({
			where: { parentId: menu.parentId ?? null },
			orderBy: { sequence: 'asc' },
		})

		const currentIndex = siblingMenus.findIndex((m) => m.id === id)
		if (currentIndex === -1) {
			throw new NotFoundError('Menu item not found in siblings')
		}

		const targetIndex = action === 'up' ? currentIndex - 1 : currentIndex + 1
		if (targetIndex < 0 || targetIndex >= siblingMenus.length) {
			throw new ConflictError(`Cannot move ${action}`)
		}

		const targetMenu = siblingMenus[targetIndex]

		// Swap sequences
		await db.adminMenu.update({
			where: { id },
			data: { sequence: targetMenu.sequence },
		})

		await db.adminMenu.update({
			where: { id: targetMenu.id },
			data: { sequence: menu.sequence },
		})

		const updatedMenu = await this.findById(id)
		return updatedMenu
	}

	/**
	 * Get available modules
	 */
	async getModules(): Promise<string[]> {
		const modules = await db.permission.findMany({
			where: { isActive: true },
			select: { module: true },
			distinct: ['module'],
			orderBy: { module: 'asc' },
		})

		return modules.map((m) => m.module)
	}

	/**
	 * Get available types for a module
	 */
	async getTypes(module: string): Promise<string[]> {
		const permissions = await db.permission.findMany({
			where: {
				module,
				isActive: true,
				type: { not: null },
			},
			select: { type: true },
			distinct: ['type'],
			orderBy: { type: 'asc' },
		})

		return permissions.map((p) => p.type!).filter(Boolean)
	}
}


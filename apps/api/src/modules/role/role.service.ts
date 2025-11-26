/**
 * @module Role Service
 * @description Business logic for role management
 */

import { db } from '@workspace/database'
import { NotFoundError, BadRequestError } from '../../shared/utils/error.util'
import {
	CreateRoleDto,
	UpdateRoleDto,
	RoleListQuery,
	RoleListResponse,
	Role,
	RoleSelectOption,
} from './role.types'
import { AuthenticatedRequest } from '@workspace/types'
import { logActivity } from '../../shared/utils/activity_log.util'
import { ActivityAction } from '../activity_log/activity_log.types'

export class RoleService {
	/**
	 * Find all roles with pagination and filters
	 * 
	 * @param query - Query parameters for filtering and pagination
	 * @returns Paginated list of roles
	 */
	async findAll(query: RoleListQuery): Promise<RoleListResponse> {
		const {
			page = 1,
			limit = 10,
			search,
			scope = 'admin',
			sortBy = 'sequence',
			sortOrder = 'asc',
		} = query

		const skip = (page - 1) * limit

		// Build where clause
		const where: any = {
			scope,
		}

		// Add search filter
		if (search) {
			where.name = {
				contains: search,
				mode: 'insensitive',
			}
		}

		// Get total count
		const total = await db.userRole.count({ where })

		// Build orderBy clause (supports relation counts)
		let orderBy: any
		if (sortBy === 'usersCount') {
			orderBy = {
				users: {
					_count: sortOrder,
				},
			}
		} else {
			orderBy = { [sortBy]: sortOrder }
		}

		// Get roles with pagination
		const roles = await db.userRole.findMany({
			where,
			skip,
			take: limit,
			orderBy,
			include: {
				rolePermissions: {
					include: {
						permission: true,
					},
				},
				_count: {
					select: {
						users: true,
					},
				},
			},
		})

		// Transform data
		const data = roles.map((role) => ({
			id: role.id,
			name: role.name,
			scope: role.scope,
			sequence: role.sequence,
			status: role.status,
			createdAt: role.createdAt,
			updatedAt: role.updatedAt,
			permissions: role.rolePermissions.map((rp) => rp.permission.id),
			usersCount: role._count.users,
		}))

		return {
			data: data as any,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		}
	}

	/**
	 * Find role by ID
	 * 
	 * @param id - Role ID
	 * @returns Role object
	 * @throws {NotFoundError} If role not found
	 */
	async findById(id: number, scope = 'admin'): Promise<Role> {
		const role = await db.userRole.findFirst({
			where: { id, scope },
			include: {
				rolePermissions: {
					include: {
						permission: true,
					},
				},
			},
		})

		if (!role) {
			throw new NotFoundError('Role not found')
		}

		return {
			id: role.id,
			name: role.name,
			scope: role.scope,
			sequence: role.sequence,
			status: role.status,
			createdAt: role.createdAt,
			updatedAt: role.updatedAt,
			permissions: role.rolePermissions.map((rp) => rp.permission.id),
		}
	}

	/**
	 * Create a new role
	 * 
	 * @param data - Role creation data
	 * @param req - Optional authenticated request for logging
	 * @returns Created role
	 */
	async create(data: CreateRoleDto, req?: AuthenticatedRequest | null): Promise<Role> {
		const scope = data.scope || 'admin'

		// Get next sequence number (start from 1, not 0)
		const maxSequence = await db.userRole.findFirst({
			where: {
				scope,
			},
			orderBy: { sequence: 'desc' },
			select: { sequence: true },
		})

		const sequence = (maxSequence?.sequence || 0) + 1

		// Create role with permissions
		const role = await db.userRole.create({
			data: {
				name: data.name,
				scope,
				status: data.status ?? false,
				sequence,
				rolePermissions: data.permissions
					? {
						create: data.permissions.map((permissionId) => ({
							permissionId,
						})),
					}
					: undefined,
			},
			include: {
				rolePermissions: {
					include: {
						permission: true,
					},
				},
			},
		})

		// Re-order after creation (ensure sequence starts from 1)
		await this.reOrder(scope)

		const result = {
			id: role.id,
			name: role.name,
			scope: role.scope,
			sequence: role.sequence,
			status: role.status,
			createdAt: role.createdAt,
			updatedAt: role.updatedAt,
			permissions: role.rolePermissions.map((rp) => rp.permission.id),
		}

		// Log activity
		await logActivity(req || null, ActivityAction.CREATE, 'Role', role.id.toString(), null, result)

		return result
	}

	/**
	 * Update role
	 * 
	 * @param id - Role ID
	 * @param data - Role update data
	 * @param req - Optional authenticated request for logging
	 * @returns Updated role
	 * @throws {NotFoundError} If role not found
	 * @throws {BadRequestError} If trying to update super admin
	 */
	async update(id: number, data: UpdateRoleDto, req?: AuthenticatedRequest | null): Promise<Role> {
		// Get old data for logging
		const oldRole = await this.findById(id, data.scope).catch(() => null)
		
		// Check if role exists
		const existingRole = await db.userRole.findFirst({
			where: { id },
		})

		if (!existingRole) {
			throw new NotFoundError('Role not found')
		}

		const nextScope = data.scope ?? existingRole.scope

		const updateData: Record<string, any> = {
			name: data.name,
			status: data.status,
		}

		if (nextScope !== existingRole.scope) {
			const maxSequence = await db.userRole.findFirst({
				where: { scope: nextScope },
				orderBy: { sequence: 'desc' },
				select: { sequence: true },
			})
			updateData.sequence = (maxSequence?.sequence ?? 0) + 1
		}

		updateData.scope = nextScope

		// Update role
		await db.userRole.update({
			where: { id },
			data: updateData,
			include: {
				rolePermissions: {
					include: {
						permission: true,
					},
				},
			},
		})

		// Update permissions if provided
		if (data.permissions !== undefined) {
			// Delete existing permissions
			await db.rolePermission.deleteMany({
				where: { roleId: id },
			})

			// Create new permissions
			if (data.permissions.length > 0) {
				await db.rolePermission.createMany({
					data: data.permissions.map((permissionId) => ({
						roleId: id,
						permissionId,
					})),
				})
			}
		}

		// Re-order after update
		await this.reOrder(existingRole.scope)
		if (nextScope !== existingRole.scope) {
			await this.reOrder(nextScope)
		}

		// Fetch updated role with permissions
		const result = await this.findById(id, nextScope)

		// Log activity
		if (oldRole) {
			await logActivity(req || null, ActivityAction.UPDATE, 'Role', id.toString(), oldRole, result)
		}

		return result
	}

	/**
	 * Toggle role status
	 * 
	 * @param id - Role ID
	 * @param req - Optional authenticated request for logging
	 * @returns Updated role
	 * @throws {NotFoundError} If role not found
	 * @throws {BadRequestError} If trying to change super admin status
	 */
	async updateStatus(id: number, req?: AuthenticatedRequest | null): Promise<Role> {
		// Get old data for logging
		const oldRole = await this.findById(id).catch(() => null)
		// Check if role exists
		const role = await db.userRole.findUnique({
			where: { id },
		})

		if (!role) {
			throw new NotFoundError('Role not found')
		}

		// Toggle status
		const updated = await db.userRole.update({
			where: { id },
			data: { status: !role.status },
			include: {
				rolePermissions: {
					include: {
						permission: true,
					},
				},
			},
		})

		const result = {
			id: updated.id,
			name: updated.name,
			scope: updated.scope,
			sequence: updated.sequence,
			status: updated.status,
			createdAt: updated.createdAt,
			updatedAt: updated.updatedAt,
			permissions: updated.rolePermissions.map((rp) => rp.permission.id),
		}

		// Log activity
		if (oldRole) {
			await logActivity(req || null, ActivityAction.UPDATE, 'Role', id.toString(), oldRole, result)
		}

		return result
	}

	/**
	 * Delete role
	 * 
	 * @param id - Role ID
	 * @param req - Optional authenticated request for logging
	 * @throws {NotFoundError} If role not found
	 * @throws {BadRequestError} If trying to delete super admin or role has users
	 */
	async delete(id: number, req?: AuthenticatedRequest | null): Promise<void> {
		// Get old data for logging
		const oldRole = await this.findById(id).catch(() => null)
		// Check if role exists
		const role = await db.userRole.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						users: true,
					},
				},
			},
		})

		if (!role) {
			throw new NotFoundError('Role not found')
		}

		if (role.scope === 'admin' && role.id === 1) {
			throw new BadRequestError('Cannot delete default admin role')
		}

		// Check if role has users
		if (role._count.users > 0) {
			throw new BadRequestError(
				`Cannot delete role. ${role._count.users} user(s) are assigned to this role`
			)
		}

		// Delete role (permissions will be cascaded)
		await db.userRole.delete({
			where: { id },
		})

		// Re-order after deletion
		await this.reOrder(role.scope)

		// Log activity
		if (oldRole) {
			await logActivity(req || null, ActivityAction.DELETE, 'Role', id.toString(), oldRole, null)
		}
	}

	/**
	 * Re-order roles by sequence (starting from 1)
	 * 
	 * @param dir - Sort direction for updated_at (default: 'desc')
	 */
	async reOrder(scope: string, dir: 'asc' | 'desc' = 'desc'): Promise<void> {
		const roles = await db.userRole.findMany({
			where: { scope },
			orderBy: [{ sequence: 'asc' }, { updatedAt: dir }],
		})

		// Update sequence for each role (starting from 1)
		for (let i = 0; i < roles.length; i++) {
			await db.userRole.update({
				where: { id: roles[i].id },
				data: { sequence: i + 1 }, // Start from 1, not 0
			})
		}
	}

	/**
	 * Move role up or down in sequence
	 * 
	 * @param id - Role ID
	 * @param move - Direction to move ('up' or 'down')
	 * @throws {NotFoundError} If role not found
	 * @throws {BadRequestError} If move is invalid (already at top/bottom)
	 */
	async setSort(id: number, action: 'up' | 'down' | number): Promise<void> {
		const role = await db.userRole.findUnique({
			where: { id },
		})

		if (!role) {
			throw new NotFoundError('Role not found')
		}

		// Get max sequence to check if this is the last role
		const maxSequenceRecord = await db.userRole.findFirst({
			where: { scope: role.scope },
			orderBy: { sequence: 'desc' },
			select: { sequence: true },
		})
		const maxSequence = maxSequenceRecord?.sequence ?? 0

		if (typeof action === 'number') {
			if (action < 1) {
				throw new BadRequestError('Sequence position must be at least 1')
			}

			const targetSequence = Math.min(action, maxSequence || 1)
			if (targetSequence === role.sequence) {
				return
			}

			await db.$transaction(async (tx) => {
				if (targetSequence < role.sequence) {
					await tx.userRole.updateMany({
						where: {
							scope: role.scope,
							sequence: {
								gte: targetSequence,
								lt: role.sequence,
							},
							id: { not: role.id },
						},
						data: {
							sequence: {
								increment: 1,
							},
						},
					})
				} else {
					await tx.userRole.updateMany({
						where: {
							scope: role.scope,
							sequence: {
								gt: role.sequence,
								lte: targetSequence,
							},
							id: { not: role.id },
						},
						data: {
							sequence: {
								decrement: 1,
							},
						},
					})
				}

				await tx.userRole.update({
					where: { id },
					data: { sequence: targetSequence },
				})
			})

			await this.reOrder(role.scope, targetSequence < role.sequence ? 'desc' : 'asc')
			return
		}

		// Validation: Cannot move up if already at the top (sequence = 1)
		if (action === 'up' && role.sequence === 1) {
			throw new BadRequestError('Cannot move up. Role is already at the top position')
		}

		// Validation: Cannot move down if already at the bottom (last sequence)
		if (action === 'down' && role.sequence === maxSequence) {
			throw new BadRequestError('Cannot move down. Role is already at the bottom position')
		}

		// Update sequence
		if (action === 'up') {
			await db.userRole.update({
				where: { id },
				data: { sequence: { decrement: 1 } },
			})
		} else {
			await db.userRole.update({
				where: { id },
				data: { sequence: { increment: 1 } },
			})
		}

		// Re-order
		await this.reOrder(role.scope, action === 'up' ? 'desc' : 'asc')
	}

	/**
	 * Get roles list for dropdown/select
	 * 
	 * @param search - Search term
	 * @param excludeId - Role ID to exclude
	 * @returns List of role options
	 */
	async getList(
		search?: string,
		excludeId?: number,
		scope: string = 'admin'
	): Promise<RoleSelectOption[]> {
		const where: any = {
			status: true,
			scope,
		}

		if (search) {
			where.name = {
				contains: search,
				mode: 'insensitive',
			}
		}

		if (excludeId) {
			where.id = { not: excludeId }
		}

		const roles = await db.userRole.findMany({
			where,
			orderBy: { sequence: 'asc' },
			select: {
				id: true,
				name: true,
			},
		})

		return roles.map((role) => ({
			id: role.id,
			text: role.name,
		}))
	}
}


/**
 * @module User Service
 * @description Business logic for user management
 */

import { db } from '@workspace/database'
// @ts-ignore - bcryptjs has default export at runtime
import bcrypt from 'bcryptjs'
import {
	CreateUserDto,
	UpdateUserDto,
	UserListQuery,
	UserListResponse,
	sanitizeAvatarInput,
	parseAvatarValue,
	serializeAvatarValue,
	mergeAvatarWithSrc,
} from './user.types'
import { NotFoundError, ConflictError, BadRequestError } from '../../shared/utils/error.util'
import { FileUtils } from '../../shared/utils/file.utils'
import { AuthenticatedRequest } from '@workspace/types'
import { logActivity } from '../../shared/utils/activity_log.util'
import { ActivityAction } from '../activity_log/activity_log.types'

export class UserService {
	/**
	 * Get paginated list of users with search and filters
	 * 
	 * @param query - Query parameters for filtering, pagination, and sorting
	 * @returns Paginated user list
	 */
	async findAll(query: UserListQuery): Promise<UserListResponse> {
		const page = query.page || 1
		const limit = query.limit || 10
		const skip = (page - 1) * limit
		const search = query.search || ''
		const roleId = query.roleId
		const sortBy = query.sortBy || 'updatedAt'
		const sortOrder = query.sortOrder || 'desc'

		// Build where clause
		const where: any = {
			deletedAt: null, // Exclude soft-deleted users
		}

		// Add search condition
		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ username: { contains: search, mode: 'insensitive' } },
				{ email: { contains: search, mode: 'insensitive' } },
			]
		}

		// Add role filter
		if (roleId) {
			where.roleId = roleId
		}

		// Get total count
		const total = await db.user.count({ where })

		// Get users with pagination
		const users = await db.user.findMany({
			where,
			skip,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
			select: {
				id: true,
				roleId: true,
				name: true,
				username: true,
				email: true,
				avatar: true,
				lang: true,
				status: true,
				loginAt: true,
				createdAt: true,
				updatedAt: true,
				role: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		})

		const formattedUsers = users.map((user) => ({
			...user,
			avatar: parseAvatarValue(user.avatar),
		}))

		return {
			data: formattedUsers as any,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		} as UserListResponse
	}

	/**
	 * Find user by ID
	 * 
	 * @param id - User ID
	 * @returns User object
	 * @throws {NotFoundError} If user not found
	 */
	async findById(id: number) {
		const user = await db.user.findFirst({
			where: {
				id,
				deletedAt: null,
			},
			select: {
				id: true,
				roleId: true,
				name: true,
				username: true,
				email: true,
				avatar: true,
				lang: true,
				status: true,
				loginAt: true,
				createdAt: true,
				updatedAt: true,
				role: {
					select: {
						id: true,
						name: true,
						sequence: true,
					},
				},
			},
		})

		if (!user) {
			throw new NotFoundError('User not found')
		}

		return {
			...user,
			avatar: parseAvatarValue(user.avatar),
		}
	}

	/**
	 * Create a new user
	 * 
	 * @param data - User creation data
	 * @param req - Optional authenticated request for logging
	 * @returns Created user
	 * @throws {ConflictError} If username or email already exists
	 */
	async create(data: CreateUserDto, req?: AuthenticatedRequest | null) {
		// Check if username exists
		const existingUsername = await db.user.findFirst({
			where: {
				username: data.username,
				deletedAt: null,
			},
		})

		if (existingUsername) {
			throw new ConflictError('Username already exists')
		}

		// Check if email exists
		const existingEmail = await db.user.findFirst({
			where: {
				email: data.email,
				deletedAt: null,
			},
		})

		if (existingEmail) {
			throw new ConflictError('Email already exists')
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(
			data.password,
			parseInt(process.env.BCRYPT_ROUNDS || '10')
		)

		const userSelect = {
			id: true,
			roleId: true,
			name: true,
			username: true,
			email: true,
			avatar: true,
			lang: true,
			status: true,
			loginAt: true,
			createdAt: true,
			updatedAt: true,
			role: {
				select: {
					id: true,
					name: true,
				},
			},
		} as const

		const avatarInput = sanitizeAvatarInput(data.avatar)

		const initialData = {
			roleId: data.roleId || null,
			name: data.name,
			username: data.username,
			email: data.email,
			password: hashedPassword,
			lang: data.lang || 'en',
			status: data.status ?? false,
			avatar: serializeAvatarValue(avatarInput),
		}

		let user = await db.user.create({
			data: initialData,
			select: userSelect,
		})

		const processedAvatar = await FileUtils.processTempUploads(
			{ avatar: avatarInput?.src ?? null },
			user.id,
			['avatar'],
			[],
			'images',
			'users'
		)

		// Ensure processedAvatar.avatar is a string, not an object
		const processedAvatarSrc = typeof processedAvatar.avatar === 'string' ? processedAvatar.avatar : (processedAvatar.avatar?.src || null)
		const finalAvatar = mergeAvatarWithSrc(
			processedAvatarSrc ?? avatarInput?.src ?? null,
			avatarInput
		)

		if (serializeAvatarValue(finalAvatar) !== initialData.avatar) {
			user = await db.user.update({
				where: { id: user.id },
				data: { avatar: serializeAvatarValue(finalAvatar) },
				select: userSelect,
			})
		}

		const result = {
			...user,
			avatar: parseAvatarValue(user.avatar),
		}

		// Log activity
		await logActivity(req || null, ActivityAction.CREATE, 'User', user.id.toString(), null, result)

		return result
	}

	/**
	 * Update user
	 * 
	 * @param id - User ID
	 * @param data - User update data
	 * @param req - Optional authenticated request for logging
	 * @returns Updated user
	 * @throws {NotFoundError} If user not found
	 * @throws {ConflictError} If email already exists
	 */
	async update(id: number, data: UpdateUserDto, req?: AuthenticatedRequest | null) {
		// Get old data for logging
		const oldUser = await this.findById(id).catch(() => null)
		
		// Check if user exists
		const existingUser = await db.user.findFirst({
			where: {
				id,
				deletedAt: null,
			},
		})

		if (!existingUser) {
			throw new NotFoundError('User not found')
		}

		// Check if email is being changed and already exists
		if (data.email && data.email !== existingUser.email) {
			const emailExists = await db.user.findFirst({
				where: {
					email: data.email,
					id: { not: id },
					deletedAt: null,
				},
			})

			if (emailExists) {
				throw new ConflictError('Email already exists')
			}
		}

		// Prepare update data
		const updateData: any = {}

		if (data.roleId !== undefined) updateData.roleId = data.roleId
		if (data.name !== undefined) updateData.name = data.name
		if (data.email !== undefined) updateData.email = data.email
		if (data.lang !== undefined) updateData.lang = data.lang
		if (data.status !== undefined) updateData.status = data.status
		const avatarInput = data.avatar !== undefined ? sanitizeAvatarInput(data.avatar) : undefined

		// Only update password if it's provided and not the placeholder
		if (data.password && data.password !== '********') {
			updateData.password = await bcrypt.hash(
				data.password,
				parseInt(process.env.BCRYPT_ROUNDS || '10')
			)
		}

		let processedData: any = { ...updateData }
 
 		if (data.avatar !== undefined) {
 			const existingAvatar = parseAvatarValue(existingUser.avatar)
			const processedFiles = await FileUtils.processTempUploads(
				{ avatar: avatarInput?.src ?? null },
				id,
				['avatar'],
				[],
				'images',
				'users',
				{ avatar: existingAvatar?.src ?? null }
			)
			// Ensure processedFiles.avatar is a string, not an object
			const processedAvatarSrc = typeof processedFiles.avatar === 'string' ? processedFiles.avatar : (processedFiles.avatar?.src || null)
			const finalAvatar = mergeAvatarWithSrc(
				processedAvatarSrc ?? avatarInput?.src ?? null,
				avatarInput
			)
			processedData.avatar = serializeAvatarValue(finalAvatar)
		} else {
			processedData.avatar = undefined
		}

		const userSelect = {
			id: true,
			roleId: true,
			name: true,
			username: true,
			email: true,
			avatar: true,
			lang: true,
			status: true,
			loginAt: true,
			createdAt: true,
			updatedAt: true,
			role: {
				select: {
					id: true,
					name: true,
				},
			},
		} as const

		const user = await db.user.update({
			where: { id },
			data: processedData,
			select: userSelect,
		})

		const result = {
			...user,
			avatar: parseAvatarValue(user.avatar),
		}

		// Log activity
		if (oldUser) {
			await logActivity(req || null, ActivityAction.UPDATE, 'User', id.toString(), oldUser, result)
		}

		return result
	}

	/**
	 * Update user status (toggle active/inactive)
	 * 
	 * @param id - User ID
	 * @param status - New status
	 * @param req - Optional authenticated request for logging
	 * @returns Updated user
	 * @throws {NotFoundError} If user not found
	 * @throws {BadRequestError} If trying to deactivate super admin
	 */
	async updateStatus(id: number, status: boolean, req?: AuthenticatedRequest | null) {
		// Get old data for logging
		const oldUser = await this.findById(id).catch(() => null)
		// Check if user exists
		const user = await db.user.findFirst({
			where: {
				id,
				deletedAt: null,
			},
			include: {
				role: true,
			},
		})

		if (!user) {
			throw new NotFoundError('User not found')
		}

		// Update status
		const updatedUser = await db.user.update({
			where: { id },
			data: { status },
			select: {
				id: true,
				roleId: true,
				name: true,
				username: true,
				email: true,
				avatar: true,
				lang: true,
				status: true,
				loginAt: true,
				createdAt: true,
				updatedAt: true,
				role: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		})

		const result = {
			...updatedUser,
			avatar: parseAvatarValue(updatedUser.avatar),
		}

		// Log activity
		if (oldUser) {
			await logActivity(req || null, ActivityAction.UPDATE, 'User', id.toString(), oldUser, result)
		}

		return result
	}

	/**
	 * Soft delete user
	 * 
	 * @param id - User ID
	 * @param req - Optional authenticated request for logging
	 * @throws {NotFoundError} If user not found
	 * @throws {BadRequestError} If trying to delete super admin
	 */
	async delete(id: number, req?: AuthenticatedRequest | null) {
		// Get old data for logging
		const oldUser = await this.findById(id).catch(() => null)
		
		// Check if user exists
		const user = await db.user.findFirst({
			where: {
				id,
				deletedAt: null,
			},
			include: {
				role: true,
			},
		})

		if (!user) {
			throw new NotFoundError('User not found')
		}

		if (user.id === 1 && (user.role?.scope ?? 'admin') === 'admin') {
			throw new BadRequestError('Cannot delete super admin user')
		}

		// Soft delete (set deletedAt timestamp)
		await db.user.update({
			where: { id },
			data: { deletedAt: new Date() },
		})

		// Log activity
		if (oldUser) {
			await logActivity(req || null, ActivityAction.DELETE, 'User', id.toString(), oldUser, null)
		}
	}

	/**
	 * Update user's role
	 * 
	 * @param userId - User ID
	 * @param roleId - New role ID
	 * @param req - Optional authenticated request for logging
	 * @returns Updated user
	 * @throws {NotFoundError} If user or role not found
	 */
	async updateUserRole(userId: number, roleId: number, req?: AuthenticatedRequest | null) {
		// Get old data for logging
		const oldUser = await this.findById(userId).catch(() => null)
		// Check if user exists
		const user = await db.user.findFirst({
			where: {
				id: userId,
				deletedAt: null,
			},
		})

		if (!user) {
			throw new NotFoundError('User not found')
		}

		// Check if role exists and is active
		const role = await db.userRole.findFirst({
			where: {
				id: roleId,
				status: true,
			},
		})

		if (!role) {
			throw new NotFoundError('Role not found or inactive')
		}

		// Update user's role
		const updatedUser = await db.user.update({
			where: { id: userId },
			data: { roleId },
			select: {
				id: true,
				roleId: true,
				name: true,
				username: true,
				email: true,
				avatar: true,
				lang: true,
				status: true,
				loginAt: true,
				createdAt: true,
				updatedAt: true,
				role: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		})

		const result = {
			...updatedUser,
			avatar: parseAvatarValue(updatedUser.avatar),
		}

		// Log activity
		if (oldUser) {
			await logActivity(req || null, ActivityAction.UPDATE, 'User', userId.toString(), oldUser, result)
		}

		return result
	}
}


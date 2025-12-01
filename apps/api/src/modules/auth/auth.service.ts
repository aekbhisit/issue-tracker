/**
 * @module Auth Service
 * @description Authentication business logic
 */

import { db } from '@workspace/database'
// @ts-ignore - bcryptjs has default export at runtime
import bcrypt from 'bcryptjs'
// @ts-ignore - jsonwebtoken has default export at runtime
import jsonwebtoken from 'jsonwebtoken'
import { LoginDto, RegisterDto, AuthTokens } from './auth.types'
import { UnauthorizedError, ConflictError, BadRequestError, DatabaseConnectionError, ConfigurationError } from '../../shared/utils/error.util'

export class AuthService {
	/**
	 * Register new user
	 * 
	 * @param data - Registration data
	 * @returns Auth tokens
	 * @throws {ConflictError} If email already exists
	 */
	async register(data: RegisterDto): Promise<AuthTokens> {
		// disable registration for now
		throw new BadRequestError('Registration is currently disabled')
		// Check if email exists
		if (data.email) {
			const existingUser = await db.user.findUnique({
				where: { email: data.email },
			})

			if (existingUser) {
				throw new ConflictError('Email already registered')
			}
		}

		// Check if username exists
		if (data.username) {
			const existingUser = await db.user.findUnique({
				where: { username: data.username },
			})

			if (existingUser) {
				throw new ConflictError('Username already registered')
			}
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(
			data.password,
			parseInt(process.env.BCRYPT_ROUNDS || '10')
		)

		// Create user
		const user = await db.user.create({
			data: {
				email: data.email,
				username: data.username,
				password: hashedPassword,
				name: data.name,
				status: true,
			},
			include: {
				role: true,
			},
		})

		// Generate token
		const accessToken = this.generateToken(user)

		return {
			accessToken,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				name: user.name,
				avatar: user.avatar,
				roleId: user.roleId,
				roleName: user.role?.name || null,
			},
		}
	}

	/**
	 * Login user
	 * Following Laravel authentication pattern:
	 * 1. Find user by username or email
	 * 2. Check if user exists
	 * 3. Check if user status is active
	 * 4. Check if user role is active
	 * 5. Check if user has permissions (except super admin)
	 * 6. Verify password
	 * 7. Update login timestamp
	 * 8. Generate JWT token
	 * 
	 * @param data - Login credentials (username or email + password)
	 * @returns Auth tokens with user info
	 * @throws {BadRequestError} If username/email not found or wrong password
	 * @throws {UnauthorizedError} If user/role inactive or no permissions
	 */
	async login(data: LoginDto): Promise<AuthTokens> {
		// Validate input: must have either username or email
		if (!data.email) {
			throw new BadRequestError('Username or email is required')
		}

		// Check JWT_SECRET before proceeding
		if (!process.env.JWT_SECRET) {
			throw new ConfigurationError('JWT_SECRET is not configured. Please set JWT_SECRET environment variable.')
		}

		let user
		try {
			// Find user by username or email
			user = await db.user.findFirst({
				where: {
					OR: [
						data.username ? { username: data.username } : {},
						data.email ? { email: data.email } : {},
					].filter(Boolean),
					deletedAt: null, // Exclude soft-deleted users
				},
				include: {
					role: {
						include: {
							rolePermissions: {
								include: {
									permission: true,
								},
							},
						},
					},
				},
			})
		} catch (dbError: any) {
			// Handle database connection errors
			if (
				dbError.name === 'PrismaClientInitializationError' ||
				dbError.message?.includes('Can\'t reach database server') ||
				dbError.message?.includes('Connection refused') ||
				dbError.message?.includes('ECONNREFUSED') ||
				dbError.code === 'P1001' ||
				dbError.code === 'P1000'
			) {
				throw new DatabaseConnectionError(
					'Unable to connect to database. Please check database configuration.',
					{
						code: dbError.code || 'DATABASE_CONNECTION_ERROR',
						message: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
					}
				)
			}
			// Re-throw other database errors
			throw dbError
		}

		// Check if user exists
		if (!user) {
			throw new BadRequestError('Invalid username or email')
		}

		// Check if user status is active
		if (!user.status) {
			throw new UnauthorizedError('Your account is inactive. Please contact administrator.')
		}

		// Check if user has a role
		if (!user.role) {
			throw new UnauthorizedError('User role not found. Please contact administrator.')
		}

		// Check if role is active
		if (!user.role.status) {
			throw new UnauthorizedError('Your role is inactive. Please contact administrator.')
		}

		// Check permissions (except for super admin - roleId 1 or sequence 0)
		// Super admin doesn't need permission checks
		// const isSuperAdmin = user.role.sequence === 0
		// if (!isSuperAdmin && user.role.rolePermissions.length === 0) {
		// 	throw new UnauthorizedError('You do not have any permissions assigned. Please contact administrator.')
		// }

		// Verify password
		const isValidPassword = await bcrypt.compare(data.password, user.password)
		if (!isValidPassword) {
			throw new BadRequestError('Invalid password')
		}

		// Update login timestamp
		await db.user.update({
			where: { id: user.id },
			data: { loginAt: new Date() },
		})

		// Generate JWT token
		const accessToken = this.generateToken(user)

		return {
			accessToken,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				name: user.name,
				avatar: user.avatar,
				roleId: user.roleId,
				roleName: user.role.name,
			},
		}
	}

	/**
	 * Generate JWT token
	 * 
	 * @param user - User object with role
	 * @returns JWT token
	 */
	private generateToken(user: any): string {
		const payload = {
			id: user.id,
			username: user.username,
			email: user.email,
			name: user.name,
			avatar: user.avatar,
			roleId: user.roleId,
			roleName: user.role?.name || null,
		}

		const secret = process.env.JWT_SECRET
		if (!secret) {
			throw new ConfigurationError('JWT_SECRET is not configured. Please set JWT_SECRET environment variable.')
		}

		const expiresIn = process.env.JWT_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRES_IN || '7d'

		try {
			// Note: expiresIn accepts numbers or specific string formats.
			// We trust configuration here and cast to satisfy TypeScript.
			return jsonwebtoken.sign(payload, secret, { expiresIn: expiresIn as any })
		} catch (jwtError: any) {
			throw new ConfigurationError(
				'Failed to generate authentication token. Please check JWT configuration.',
				{
					code: 'JWT_SIGN_ERROR',
					message: process.env.NODE_ENV === 'development' ? jwtError.message : undefined,
				}
			)
		}
	}

	/**
	 * Verify JWT token
	 * 
	 * @param token - JWT token
	 * @returns Decoded token payload
	 * @throws {UnauthorizedError} If token is invalid
	 */
	async verifyToken(token: string) {
		try {
			const secret = process.env.JWT_SECRET
			if (!secret) {
				throw new ConfigurationError('JWT_SECRET is not configured. Please set JWT_SECRET environment variable.')
			}
			return jsonwebtoken.verify(token, secret)
		} catch (error: any) {
			if (error.name === 'TokenExpiredError') {
				throw new UnauthorizedError('Your session has expired. Please log in again.')
			}
			if (error.name === 'JsonWebTokenError') {
				throw new UnauthorizedError('Invalid authentication token. Please log in again.')
			}
			if (error instanceof ConfigurationError) {
				throw error
			}
			throw new UnauthorizedError('Invalid token')
		}
	}
}


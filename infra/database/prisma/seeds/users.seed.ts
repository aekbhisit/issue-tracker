/**
 * User Seeds
 * Seeds default users (roles are seeded separately)
 */

import { PrismaClient } from '@prisma/client'

export async function seedUsers(prisma: PrismaClient) {
	console.log('👥 Seeding users...')

	// Get Super Admin role (created by roles.seed.ts)
	const superAdminRole = await prisma.userRole.findFirst({
		where: { name: 'Super Admin' },
	})

	if (!superAdminRole) {
		console.log('⚠️ Super Admin role not found. Make sure to run roles seed first.')
		return
	}

	// ===================================
	// Seed Superadmin User
	// ===================================
	console.log('👤 Creating superadmin user...')

	// Simple hardcoded hash for "admin" password
	// Generated with: bcrypt.hash('admin', 10)
	const hashedPassword = '$2a$10$jzy0vbKPFf6cSLTqay.QFuiugcGJP73.ikyJGf4V1WMRRCdo8bQEm'

	let superadminUser = await prisma.user.findUnique({
		where: { username: 'admin' },
	})

	if (!superadminUser) {
		superadminUser = await prisma.user.create({
			data: {
				roleId: superAdminRole.id,
				username: 'admin',
				name: 'Super Admin',
				email: 'admin@admin.com',
				password: hashedPassword,
				status: true,
				lang: 'en',
			},
		})
		console.log('✅ Superadmin user created')
	} else {
		console.log('✅ Superadmin user already exists')
	}

	console.log('📧 Email: admin@admin.com')
	console.log('🔑 Password: admin')
}


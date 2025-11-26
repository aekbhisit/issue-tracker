/**
 * @module Roles Seed
 * @description Seed default roles with permissions
 */

import { PrismaClient } from '@prisma/client'

export async function seedRoles(prisma: PrismaClient) {
	console.log('🌱 Seeding roles...')


	// ============================================
	// Super Admin - All permissions
	// ============================================
	const superAdmin = await prisma.userRole.upsert({
		where: { id: 1 },
		update: {
			name: 'Super Admin',
			scope: 'admin',
			status: true,
			sequence: 0,
		},
		create: {
			id: 1,
			name: 'Super Admin',
			scope: 'admin',
			sequence: 0,
			status: true,
		},
	})

	// Get all admin-scope permissions
	const allAdminPermissions = await prisma.permission.findMany({
		where: { scope: 'admin' },
	})

	// Delete existing permissions for Super Admin
	await prisma.rolePermission.deleteMany({
		where: { roleId: superAdmin.id },
	})

	// Assign all permissions to Super Admin
	if (allAdminPermissions.length > 0) {
		await prisma.rolePermission.createMany({
			data: allAdminPermissions.map((permission) => ({
				roleId: superAdmin.id,
				permissionId: permission.id,
			})),
			skipDuplicates: true,
		})
		console.log(
			`✅ Super Admin created with ${allAdminPermissions.length} permissions`
		)
	}

	console.log('✅ Roles seeded successfully')
}


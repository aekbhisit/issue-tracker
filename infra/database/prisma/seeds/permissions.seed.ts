/**
 * @module Permissions Seed
 * @description Seed permissions for all admin API endpoints
 */

import { PrismaClient } from '@prisma/client'
import { getAllRoutes } from '../../../../apps/api/src/shared/utils/route.util'
import { RouteInfo } from '../../../../apps/api/src/shared/types/route.types'
import app from '../../../../apps/api/src/app'
import { config } from '../../../../packages/config'
import {
	deriveModule,
	deriveAction,
	composeMetaName,
	isModuleAllowed,
} from '../../../../apps/api/src/shared/utils/permission.util'

const ADMIN_PREFIX = config.api.adminPrefix
const MEMBER_PREFIX = config.api.memberPrefix


export async function seedPermissions(prisma: PrismaClient) {
	console.log('🌱 Seeding permissions...')
	const permissionDelegate = prisma.permission as any

	await permissionDelegate.updateMany({
		data: { isActive: false },
	})

	const existingPermissions = (await permissionDelegate.findMany()) as Array<Record<string, any>>
	const existingMap = new Map<string, Record<string, any>>(
		existingPermissions.map(permission => [`${permission.scope}:${permission.metaName}`, permission]),
	)
	const processedMetaNames = new Set<string>()

	const prefixes = [
		{ prefix: ADMIN_PREFIX, scope: 'admin' },
		{ prefix: MEMBER_PREFIX, scope: 'member' },
	]

	for (const { prefix, scope } of prefixes) {
		const routes = getAllRoutes(app._router.stack, prefix)
		for (const route of routes) {
			await syncRoutePermissions(prisma, route, scope, existingMap, processedMetaNames)
		}
	}

	await permissionDelegate.deleteMany({
		where: { isActive: false },
	})

	console.log(`✅ Seeded permissions for ${processedMetaNames.size} permissions`)
}

async function syncRoutePermissions(
	prisma: PrismaClient,
	route: RouteInfo,
	scope: string,
	existingMap: Map<string, any>,
	processedMetaNames: Set<string>,
) {
	const permissionDelegate = prisma.permission as any

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
			const scopedKey = `${scope}:${metaName}`
			if (processedMetaNames.has(scopedKey)) continue
			processedMetaNames.add(scopedKey)

			const autoDescription = [type, actionValue].filter(Boolean).join(' ') || actionValue
			const description = meta?.description ?? autoDescription
			const existing = existingMap.get(scopedKey)

			const data = {
				scope,
				path: route.path,
				module: moduleName,
				method,
				action: actionValue,
				group: groupValue,
				type: type ?? null,
				metaName,
				description,
				isActive: true,
			}

			if (existing) {
				await permissionDelegate.update({
					where: { id: existing.id },
					data,
				})
			} else {
				await permissionDelegate.create({
					data,
				})
			}
		}
	}
}

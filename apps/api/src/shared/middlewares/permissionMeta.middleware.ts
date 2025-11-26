import { RequestHandler } from 'express'
import { RoutePermissionMeta } from '../types/permission.types'

type PermissionMetaHandler = RequestHandler & {
	permissionMeta?: RoutePermissionMeta
}

const DEFAULT_TYPE_PARAM = 'type'

export const permissionMeta = (config: RoutePermissionMeta): PermissionMetaHandler => {
	const handler: PermissionMetaHandler = (_req, _res, next) => {
		next()
	}

	handler.permissionMeta = {
		...config,
		scope: config.scope, // Auto-detected from path if not provided
		typeParam: config.typeParam ?? DEFAULT_TYPE_PARAM,
	}

	return handler
}



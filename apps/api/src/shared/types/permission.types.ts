export interface PermissionMetaOptions {
	module: string
	scope?: string
	group: string
	action: string
	types?: string[]
	typeParam?: string
	description?: string
	metaName?: string
}

export type RoutePermissionMeta = PermissionMetaOptions

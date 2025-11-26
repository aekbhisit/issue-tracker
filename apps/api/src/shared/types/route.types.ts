import { RoutePermissionMeta } from './permission.types'

export interface RouteInfo {
	path: string
	methods: string[]
	meta?: RoutePermissionMeta
}
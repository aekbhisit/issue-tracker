import { RouteInfo } from '../types/route.types'

const sanitizeSlashes = (value: string) => {
	const normalized = value.replace(/\\/g, '/').replace(/\/{2,}/g, '/').replace(/\/+$/, '')
	return normalized || '/'
}

export function getAllRoutes(stack: any[], prefix = '', base = ''): RouteInfo[] {
	const routes: RouteInfo[] = []
	stack.forEach(layer => {
		if (layer.route) {
			const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase())
			const fullPath = sanitizeSlashes(`${base}${layer.route.path}`)
			if (!prefix || fullPath.startsWith(prefix)) {
				const meta = layer.route.stack
					.map((inner: any) => inner.handle?.permissionMeta ?? inner.permissionMeta)
					.find(Boolean)
				routes.push({ path: fullPath, methods, meta })
			}
		} else if (layer.name === 'router' && layer.handle?.stack) {
			let newBase = base
			if (layer.regexp && layer.regexp.source !== '^\\/?$') {
				// Use layer.keys to reconstruct original path
				if (layer.keys && layer.keys.length > 0) {
					// Build path from regexp source and replace patterns with param names
					let path = layer.regexp.source
						.replace('^\\/', '/')
						.replace('\\/?(?=\\/|$)', '')
						.replace(/\\\//g, '/')
					
					// Replace (?:/([^/]+?)) pattern with :paramName from keys
					// Use simple string replacement instead of complex regex
					layer.keys.forEach((key: any) => {
						// Replace the pattern (?:/([^/]+?)) with /:paramName
						path = path.replace('(?:/([^/]+?))', `/:${key.name}`)
					})
					
					newBase += path
				} else {
					// Fallback: use regexp source as-is (no conversion)
					const path = layer.regexp.source
						.replace('^\\/', '/')
						.replace('\\/?(?=\\/|$)', '')
						.replace(/\\\//g, '/')
					
					newBase += path
				}
			}
			routes.push(...getAllRoutes(layer.handle.stack, prefix, sanitizeSlashes(newBase)))
		}
	})
	return routes
}

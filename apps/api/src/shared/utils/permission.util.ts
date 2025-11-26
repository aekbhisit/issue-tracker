/**
 * @module Permission Utilities
 * @description Utility functions for permission management
 */

import { config } from '@workspace/config'

/**
 * Get allowed modules from config
 * @returns Set of allowed module names
 */
function getAllowedModules(): Set<string> {
	const allowedModules = config.allowedModules || {}
	return new Set(Object.keys(allowedModules).filter(key => (allowedModules as Record<string, boolean>)[key] === true))
}

/**
 * Derive module name from path
 * @param path - Route path (e.g., /api/admin/v1/content-category/:type)
 * @returns Module name (e.g., 'content-category')
 */
export function deriveModule(path: string): string {
	return path.split('/')[4] || 'module'
}

/**
 * Derive action from path
 * @param path - Route path
 * @param fallback - Fallback value if action cannot be derived
 * @returns Action name
 */
export function deriveAction(path: string, fallback: string): string {
	return path.split('/')[5] || fallback
}

/**
 * Compose meta name from components
 * @param moduleName - Module name
 * @param type - Type (optional)
 * @param group - Group name
 * @param action - Action name
 * @returns Meta name (e.g., 'content_category.product.view.get_data')
 */
export function composeMetaName(
	moduleName: string,
	type: string | undefined,
	group: string,
	action: string,
): string {
	return [moduleName, type, group, action].filter(Boolean).join('.')
}

/**
 * Check if module is allowed
 * @param moduleName - Module name to check
 * @returns True if module is allowed
 */
export function isModuleAllowed(moduleName: string): boolean {
	const allowedModules = getAllowedModules()
	if (allowedModules.size === 0) {
		return true
	}
	const normalized = moduleName.replace(/_/g, '-').toLowerCase()
	return allowedModules.has(normalized)
}


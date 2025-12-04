/**
 * @module Permission Utilities
 * @description Utility functions for permission checking in frontend
 */

import { getUser } from '@/lib/auth/token'
import type { User } from '@/lib/auth/auth'
import { getUserPermissions as fetchUserPermissions } from '@/lib/api/permission.api'

const PERMISSIONS_CACHE_KEY = 'admin_user_permissions'
const PERMISSIONS_CACHE_TTL = 15 * 60 * 1000 // 15 minutes in milliseconds

interface CachedPermissions {
	permissions: string[]
	timestamp: number
	roleId: string | number
}

/**
 * Get user info from localStorage
 */
function getCurrentUser(): User | null {
	return getUser()
}

/**
 * Check if user is super admin (roleId === 1)
 */
export function isSuperAdmin(): boolean {
	const user = getCurrentUser()
	if (!user) return false

	const roleId = typeof user.roleId === 'string' ? parseInt(user.roleId, 10) : user.roleId
	return roleId === 1
}

/**
 * Get cached permissions from localStorage
 */
function getCachedPermissions(): string[] | null {
	if (typeof window === 'undefined') return null

	try {
		const cachedStr = localStorage.getItem(PERMISSIONS_CACHE_KEY)
		if (!cachedStr) return null

		const cached: CachedPermissions = JSON.parse(cachedStr)
		const now = Date.now()

		// Check if cache is still valid and role hasn't changed
		const user = getCurrentUser()
		if (!user) {
			localStorage.removeItem(PERMISSIONS_CACHE_KEY)
			return null
		}

		const currentRoleId = user.roleId
		const cachedRoleId = cached.roleId

		// Clear cache if role changed or cache expired
		if (currentRoleId !== cachedRoleId || now - cached.timestamp > PERMISSIONS_CACHE_TTL) {
			localStorage.removeItem(PERMISSIONS_CACHE_KEY)
			return null
		}

		return cached.permissions
	} catch {
		return null
	}
}

/**
 * Cache permissions in localStorage
 */
function cachePermissions(permissions: string[]): void {
	if (typeof window === 'undefined') return

	try {
		const user = getCurrentUser()
		const cached: CachedPermissions = {
			permissions,
			timestamp: Date.now(),
			roleId: user?.roleId || '',
		}
		localStorage.setItem(PERMISSIONS_CACHE_KEY, JSON.stringify(cached))
	} catch (error) {
		console.error('Failed to cache permissions:', error)
	}
}

/**
 * Clear cached permissions
 */
export function clearPermissionsCache(): void {
	if (typeof window === 'undefined') return
	localStorage.removeItem(PERMISSIONS_CACHE_KEY)
}

/**
 * Get user permissions from cache
 * @returns Array of permission metaNames
 */
export function getUserPermissions(): string[] {
	// If super admin, return empty array (super admin bypasses permission checks)
	if (isSuperAdmin()) {
		return []
	}

	const cached = getCachedPermissions()
	return cached || []
}

/**
 * Fetch and cache user permissions from API
 * @returns Promise that resolves to array of permission metaNames
 */
export async function fetchAndCacheUserPermissions(): Promise<string[]> {
	// If super admin, return empty array
	if (isSuperAdmin()) {
		return []
	}

	try {
		const permissions = await fetchUserPermissions()
		cachePermissions(permissions)
		return permissions
	} catch (error) {
		console.error('Failed to fetch user permissions:', error)
		// Return cached permissions if available, otherwise empty array
		return getUserPermissions()
	}
}

/**
 * Set user permissions (called after fetching from API)
 */
export function setUserPermissions(permissions: string[]): void {
	cachePermissions(permissions)
}

/**
 * Check if user has a specific permission by metaName
 * @param metaName - Permission metaName (e.g., "user.admin.default.add_data")
 * @returns true if user has permission or is super admin
 */
export function hasPermission(metaName: string): boolean {
	if (isSuperAdmin()) {
		return true
	}

	const permissions = getUserPermissions()
	return permissions.includes(metaName)
}

/**
 * Compose metaName from module, type, group, and action
 * @param module - Module name (e.g., "user")
 * @param type - Type name (optional, e.g., "admin")
 * @param group - Group name (e.g., "default")
 * @param action - Action name (e.g., "add_data")
 * @returns Composed metaName (e.g., "user.admin.default.add_data")
 */
export function composeMetaName(
	module: string,
	type: string | null | undefined,
	group: string,
	action: string,
): string {
	const parts = [module, type, group, action].filter((part) => part != null && part !== '')
	return parts.join('.')
}

/**
 * Check if user can access a resource by composing metaName
 * @param module - Module name
 * @param type - Type name (optional)
 * @param group - Group name
 * @param action - Action name
 * @returns true if user has permission or is super admin
 */
export function canAccess(
	module: string,
	type: string | null | undefined,
	group: string,
	action: string,
): boolean {
	const metaName = composeMetaName(module, type, group, action)
	return hasPermission(metaName)
}

/**
 * Helper function to check permission
 * @param module - Module name (e.g., "user")
 * @param action - Action name (e.g., "add_data", "edit_data", "delete_data")
 * @param type - Type name (optional, e.g., "admin")
 * @param group - Group name (optional, default: "default")
 * @returns true if user has permission or is super admin
 */
export function checkPermission(
	module: string,
	action: string,
	type?: string | null,
	group: string = 'default',
): boolean {
	return canAccess(module, type, group, action)
}

/**
 * Check page permission and return result
 * This function will fetch permissions if not cached
 * 
 * @param module - Module name (e.g., "user")
 * @param action - Action name (e.g., "get_data", "view")
 * @param type - Type name (optional, e.g., "admin")
 * @param group - Group name (optional, default: "default")
 * @returns Promise that resolves to boolean indicating if user has permission
 * 
 * @example
 * ```tsx
 * const hasPermission = await checkPagePermission("user", "get_data", "admin");
 * if (!hasPermission) {
 *   router.push("/admin/dashboard");
 * }
 * ```
 */
export async function checkPagePermission(
	module: string,
	action: string = "get_data",
	type?: string | null,
	group: string = "default",
): Promise<boolean> {
	// Fetch and cache permissions first
	await fetchAndCacheUserPermissions();
	
	// Check permission
	return checkPermission(module, action, type, group);
}

/**
 * Hook helper function - checks page permission with redirect and error handling
 * Use this in a useEffect hook in page components
 * 
 * @param options - Permission check options
 * @param onDenied - Callback when permission is denied (for redirect/error handling)
 * @returns Promise that resolves to boolean indicating if user has permission
 * 
 * @example
 * ```tsx
 * useEffect(() => {
 *   checkPageAccess(
 *     { module: "user", action: "get_data", type: "admin" },
 *     (denied) => {
 *       if (denied) {
 *         showError({ message: "No permission" });
 *         router.push("/admin/dashboard");
 *       }
 *     }
 *   );
 * }, []);
 * ```
 */
export async function checkPageAccess(
	options: {
		module: string;
		action?: string;
		type?: string | null;
		group?: string;
	},
	onDenied?: (denied: boolean) => void,
): Promise<boolean> {
	const {
		module,
		action = "get_data",
		type,
		group = "default",
	} = options;

	try {
		const hasPermission = await checkPagePermission(module, action, type, group);
		
		if (!hasPermission && onDenied) {
			onDenied(true);
		}
		
		return hasPermission;
	} catch (error) {
		console.error("Failed to check page permission", error);
		if (onDenied) {
			onDenied(true);
		}
		return false;
	}
}

/**
 * @module Config Package
 * @description Shared configuration utilities and API route prefixes
 */

// Export enhanced config loader
export { getConfig, getCachedConfig, resetConfigCache, type Config } from './src/config'

// Legacy API route prefixes (for backward compatibility)
export const config = {
    api: {
        adminPrefix: '/api/admin/v1',
        memberPrefix: '/api/member/v1',
        publicPrefix: '/api/public/v1',
    },
    allowedModules: {
        'auth': true,
        'user': true,
        'role': true,
        'permission': true,
        'dashboard': true,
        'banner': true,
        'content-category': true,
        'content': true,
        'page': true,
        'admin-menu': true,
    },
};
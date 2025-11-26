"use strict";
/**
 * @module Config Package
 * @description Shared configuration utilities and API route prefixes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.resetConfigCache = exports.getCachedConfig = exports.getConfig = void 0;
// Export enhanced config loader
var config_1 = require("./src/config");
Object.defineProperty(exports, "getConfig", { enumerable: true, get: function () { return config_1.getConfig; } });
Object.defineProperty(exports, "getCachedConfig", { enumerable: true, get: function () { return config_1.getCachedConfig; } });
Object.defineProperty(exports, "resetConfigCache", { enumerable: true, get: function () { return config_1.resetConfigCache; } });
// Legacy API route prefixes (for backward compatibility)
exports.config = {
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

// Common locales (shared across all apps)
import commonTh from './common/th.json'
import commonEn from './common/en.json'

// Admin locales
import adminTh from './admin/th.json'
import adminEn from './admin/en.json'

// Frontend locales
import frontendTh from './frontend/th.json'
import frontendEn from './frontend/en.json'

// Export all locales
export const locales = {
  th: {
    ...commonTh,
    ...adminTh,
    ...frontendTh
  },
  en: {
    ...commonEn,
    ...adminEn,
    ...frontendEn
  }
}

// Export by namespace for more granular control
export const commonLocales = {
  th: commonTh,
  en: commonEn
}

export const adminLocales = {
  th: adminTh,
  en: adminEn
}

export const frontendLocales = {
  th: frontendTh,
  en: frontendEn
}

// Export default
export default locales


import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Check if we're on the client side
const isClient = typeof window !== 'undefined'

// Safely import locales with fallback
let locales: { th: any; en: any }
try {
  const localesModule = require('@workspace/locales')
  locales = localesModule.locales || { th: {}, en: {} }
} catch (error) {
  console.error('Failed to load locales, using empty fallback:', error)
  // Fallback to empty locales to prevent app crash
  locales = { th: {}, en: {} }
}

// Initialize i18next
const i18nInstance = i18n

// CRITICAL: Do NOT use LanguageDetector during initialization
// LanguageDetector will be added AFTER hydration completes to prevent mismatches
// We'll manually detect language after React hydration

// Initialize i18n with error handling
// CRITICAL: Force 'th' language on both server and client to prevent hydration mismatch
// Language detection will ONLY happen AFTER React hydration completes
try {
  i18nInstance
    .use(initReactI18next) // Pass i18n instance to react-i18next
    .init({
      resources: {
        th: {
          translation: locales.th || {}
        },
        en: {
          translation: locales.en || {}
        }
      },
    // CRITICAL: Force 'th' as the ONLY language during initialization (both server and client)
    // This ensures server and client render the same content
    // Language detection will happen AFTER hydration completes
    lng: 'th', // Force Thai on both server and client
    fallbackLng: 'th', // Default language
    supportedLngs: ['th', 'en'],
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false // React already escapes values
    },

    // CRITICAL: Disable ALL automatic language detection during initialization
    // This prevents server from detecting different language than client
    // We will manually detect and change language AFTER hydration
    detection: {
      // Completely disable detection during init
      // This prevents any language detection on server or during initial client render
      order: [], // Empty order = no detection
      caches: [], // No caches
      lookupCookie: false,
      lookupLocalStorage: false,
      lookupSessionStorage: false,
      lookupQuerystring: false,
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
    } as any // Type assertion needed due to i18next type definitions
  })
} catch (error) {
  console.error('Failed to initialize i18n:', error)
  // Continue with default initialization to prevent app crash
  i18nInstance.init({
    lng: 'th',
    fallbackLng: 'th',
    resources: {
      th: { translation: {} },
      en: { translation: {} }
    }
  })
}

// On client side, detect and change language AFTER hydration completes (prevents hydration mismatch)
if (isClient) {
  // Add LanguageDetector AFTER initialization to prevent it from running during SSR
  i18nInstance.use(LanguageDetector)
  
  // Reconfigure detection now that we're on client side
  // But still delay actual detection until after hydration
  i18nInstance.services.languageDetector?.init({
    order: ['cookie', 'localStorage', 'navigator'],
    caches: ['cookie', 'localStorage'],
    cookieOptions: { 
      path: '/', 
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 // 1 year
    },
    lookupCookie: true,
    lookupLocalStorage: true,
    lookupSessionStorage: false,
  } as any)
  
  // Use requestAnimationFrame to ensure this runs after React hydration completes
  // This is more reliable than setTimeout(0) as it waits for the browser to be ready
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      // Use another requestAnimationFrame to ensure React hydration is complete
      requestAnimationFrame(() => {
        const detectedLang = i18nInstance.services.languageDetector?.detect() || 'th'
        if (detectedLang !== i18nInstance.language) {
          i18nInstance.changeLanguage(detectedLang).catch(() => {
            // Silently fail if language change fails
          })
        }
      })
    })
  } else {
    // Fallback for environments without requestAnimationFrame
    setTimeout(() => {
      const detectedLang = i18nInstance.services.languageDetector?.detect() || 'th'
      if (detectedLang !== i18nInstance.language) {
        i18nInstance.changeLanguage(detectedLang).catch(() => {
          // Silently fail if language change fails
        })
      }
    }, 100) // Slightly longer delay to ensure hydration completes
  }
}

export default i18nInstance


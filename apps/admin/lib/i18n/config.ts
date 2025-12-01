import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { locales } from '@workspace/locales'

// Check if we're on the client side
const isClient = typeof window !== 'undefined'

// Initialize i18next
const i18nInstance = i18n

// Only use LanguageDetector on client side to avoid hydration mismatches
if (isClient) {
  i18nInstance.use(LanguageDetector)
}

i18nInstance
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources: {
      th: {
        translation: locales.th
      },
      en: {
        translation: locales.en
      }
    },
    // CRITICAL: Always use 'th' as initial language to prevent hydration mismatch
    // Language detection will happen on client side AFTER hydration completes
    lng: 'th',
    fallbackLng: 'th', // Default language
    supportedLngs: ['th', 'en'],
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false // React already escapes values
    },

    // Only configure detection on client side (after hydration)
    // Note: We disable automatic detection during init to prevent hydration mismatches
    // Language will be detected and changed after React hydration completes
    ...(isClient && {
      detection: {
        // Order of language detection
        order: ['cookie', 'localStorage', 'navigator'],
        caches: ['cookie', 'localStorage'],
        cookieOptions: { 
          path: '/', 
          sameSite: 'lax',
          maxAge: 365 * 24 * 60 * 60 // 1 year
        },
        // Disable automatic detection during initialization
        // These are optional properties that prevent detection on init
        lookupCookie: false,
        lookupLocalStorage: false,
        lookupSessionStorage: false,
        // lookupQuerystring expects string (query param name) or false, but TypeScript types may be strict
        // We omit it to avoid type issues - detection will happen manually after hydration
      } as any // Type assertion needed due to i18next type definitions
    })
  })

// On client side, detect and change language AFTER initialization (prevents hydration mismatch)
if (isClient) {
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


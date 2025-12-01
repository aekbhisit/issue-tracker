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
        // Don't detect on init - wait for explicit changeLanguage call after hydration
        lookupCookie: false,
        lookupLocalStorage: false,
        lookupQuerystring: false,
        lookupSessionStorage: false
      }
    })
  })

// On client side, detect and change language AFTER initialization (prevents hydration mismatch)
if (isClient) {
  // Use setTimeout to ensure this runs after React hydration
  setTimeout(() => {
    const detectedLang = i18nInstance.services.languageDetector?.detect() || 'th'
    if (detectedLang !== i18nInstance.language) {
      i18nInstance.changeLanguage(detectedLang).catch(() => {
        // Silently fail if language change fails
      })
    }
  }, 0)
}

export default i18nInstance


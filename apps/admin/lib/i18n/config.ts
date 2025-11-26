import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { locales } from '@workspace/locales'

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect user language
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
    fallbackLng: 'th', // Default language
    supportedLngs: ['th', 'en'],
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false // React already escapes values
    },

    detection: {
      // Order of language detection
      order: ['cookie', 'localStorage', 'navigator'],
      caches: ['cookie', 'localStorage'],
      cookieOptions: { 
        path: '/', 
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60 // 1 year
      }
    }
  })

export default i18n


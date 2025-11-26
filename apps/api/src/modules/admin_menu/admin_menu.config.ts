// Admin Menu configuration

export const adminMenuConfig = {
	languages: ['th', 'en'],
	defaultLanguage: 'th',
} as const

export type AdminMenuConfig = typeof adminMenuConfig

export function getLanguages(): string[] {
	return [...adminMenuConfig.languages]
}


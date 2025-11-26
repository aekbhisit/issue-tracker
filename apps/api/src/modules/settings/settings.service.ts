import { db } from '@workspace/database'

export interface SettingsLanguage {
	code: string
	name: string
	isDefault: boolean
}

const FALLBACK_LANGUAGES: SettingsLanguage[] = [
	{ code: 'th', name: 'ไทย', isDefault: true },
	{ code: 'en', name: 'English', isDefault: false },
]

export class SettingsService {
	async getLanguages(): Promise<SettingsLanguage[]> {
		const languages = await db.language.findMany({
			where: { status: true },
			orderBy: [{ sequence: 'asc' }, { code: 'asc' }],
			select: {
				code: true,
				name: true,
				isDefault: true,
			},
		})

		if (!languages || languages.length === 0) {
			return FALLBACK_LANGUAGES
		}

		return languages.map((language) => ({
			code: language.code,
			name: language.name,
			isDefault: language.isDefault ?? false,
		}))
	}
}



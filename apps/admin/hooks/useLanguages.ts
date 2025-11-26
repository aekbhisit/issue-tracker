"use client"

import { useEffect, useMemo, useState } from "react"

import { settingsApiService, type SettingsLanguage } from "@/app/api/modules/settings/settings.api"

const FALLBACK_LANGUAGES: SettingsLanguage[] = [
	{ code: "th", name: "ไทย", isDefault: true },
	{ code: "en", name: "English", isDefault: false },
]

let cachedLanguages: SettingsLanguage[] | null = null
let pendingRequest: Promise<SettingsLanguage[]> | null = null

export function useLanguages() {
	const [languages, setLanguages] = useState<SettingsLanguage[]>(cachedLanguages ?? FALLBACK_LANGUAGES)
	const [isLoading, setIsLoading] = useState(!cachedLanguages)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		if (cachedLanguages) {
			setIsLoading(false)
			return
		}

		if (!pendingRequest) {
			pendingRequest = settingsApiService
				.getLanguages()
				.then((result) => {
					cachedLanguages = result && result.length > 0 ? result : FALLBACK_LANGUAGES
					return cachedLanguages
				})
				.catch((err) => {
					cachedLanguages = FALLBACK_LANGUAGES
					throw err
				})
		}

		pendingRequest
			.then((data) => {
				setLanguages(data)
				setIsLoading(false)
			})
			.catch((err) => {
				setLanguages(FALLBACK_LANGUAGES)
				setError(err instanceof Error ? err : new Error("Failed to load languages"))
				setIsLoading(false)
			})
	}, [])

	const languageCodes = useMemo(() => languages.map((lang) => lang.code), [languages])
	const defaultLanguage = useMemo(() => {
		return languages.find((lang) => lang.isDefault)?.code ?? languageCodes[0] ?? "th"
	}, [languages, languageCodes])

	return {
		languages,
		languageCodes,
		defaultLanguage,
		isLoading,
		error,
	}
}



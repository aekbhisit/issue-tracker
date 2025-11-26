"use client"

import { useEffect, useMemo, useState } from "react"

export interface AdminConfigLanguage {
	code: string
	name: string
	default?: boolean
}

export interface AdminConfig {
	languages: AdminConfigLanguage[]
}

const FALLBACK_LANGUAGES: AdminConfigLanguage[] = [
	{ code: "th", name: "ไทย", default: true },
	{ code: "en", name: "English", default: false },
]

const FALLBACK_CONFIG: AdminConfig = {
	languages: FALLBACK_LANGUAGES,
}

let cachedConfig: AdminConfig | null = null
let pendingRequest: Promise<AdminConfig> | null = null

async function fetchAdminConfig(): Promise<AdminConfig> {
	const response = await fetch("/config/admin.json", { cache: "force-cache" })
	if (!response.ok) {
		throw new Error(`Failed to load admin config: ${response.status}`)
	}

	const data = await response.json()
	const languages: AdminConfigLanguage[] = Array.isArray(data?.languages) && data.languages.length > 0
		? data.languages
		: FALLBACK_LANGUAGES

	return {
		languages: languages.map((lang) => ({
			code: lang.code,
			name: lang.name,
			default: lang.default ?? false,
		})),
	}
}

export function useAdminConfig() {
	const [config, setConfig] = useState<AdminConfig>(cachedConfig ?? FALLBACK_CONFIG)
	const [isLoading, setIsLoading] = useState(!cachedConfig)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		if (cachedConfig) {
			setIsLoading(false)
			return
		}

		if (!pendingRequest) {
			pendingRequest = fetchAdminConfig()
				.then((result) => {
					cachedConfig = result
					return cachedConfig
				})
				.catch((err) => {
					cachedConfig = FALLBACK_CONFIG
					throw err
				})
		}

		pendingRequest
			.then((data) => {
				setConfig(data)
				setIsLoading(false)
			})
			.catch((err) => {
				setConfig(FALLBACK_CONFIG)
				setError(err instanceof Error ? err : new Error("Failed to load admin config"))
				setIsLoading(false)
			})
	}, [])

	return { config, isLoading, error }
}

export function useAdminLanguages() {
	const { config, isLoading, error } = useAdminConfig()

	const languages = config.languages ?? FALLBACK_LANGUAGES
	const languageCodes = useMemo(() => languages.map((lang) => lang.code), [languages])
	const defaultLanguage = useMemo(() => {
		return languages.find((lang) => lang.default)?.code ?? languageCodes[0] ?? FALLBACK_LANGUAGES[0].code
	}, [languages, languageCodes])

	return {
		languages,
		languageCodes,
		defaultLanguage,
		isLoading,
		error,
	}
}



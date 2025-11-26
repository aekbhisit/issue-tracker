"use client"

import { useTranslation } from "react-i18next"
import ReactSelect from "@/components/form/inputs/ReactSelect"

export interface LanguageOption {
	code: string
	name: string
}

interface LanguageSelectorProps {
	currentLanguage: string
	onLanguageChange: (lang: string) => void
	languages: LanguageOption[]
	/**
	 * Show the language selector only if there are multiple languages
	 * @default true
	 */
	showOnlyIfMultiple?: boolean
	/**
	 * Show the language selector based on config status
	 * @default true
	 */
	showIfEnabled?: boolean
	/**
	 * Custom ID for the select input
	 * @default "language-selector"
	 */
	id?: string
	/**
	 * Custom name for the select input
	 * @default "language"
	 */
	name?: string
	/**
	 * Show the section wrapper with title
	 * @default true
	 */
	showSection?: boolean
	/**
	 * Custom section title
	 * @default "common.label.language"
	 */
	sectionTitle?: string
	/**
	 * Whether the field is required
	 * @default true
	 */
	required?: boolean
}

export function LanguageSelector({
	currentLanguage,
	onLanguageChange,
	languages,
	showOnlyIfMultiple = true,
	showIfEnabled = true,
	id = "language-selector",
	name = "language",
	showSection = true,
	sectionTitle = "common.label.language",
	required = true,
}: LanguageSelectorProps) {
	const { t } = useTranslation()

	// Generate language options
const languageOptions = languages.map((lang) => ({
	value: lang.code,
	label: lang.name || lang.code.toUpperCase(),
	}))

	// Conditional rendering
	if (showOnlyIfMultiple && languages.length <= 1) {
		return null
	}

	if (!showIfEnabled) {
		return null
	}

	const selectComponent = (
		<ReactSelect
			id={id}
			name={name}
			label={t("common.label.language")}
		value={currentLanguage}
		onChange={(value) => onLanguageChange(String(value))}
			options={languageOptions}
			placeholder={t("common.selectPlaceholder")}
			isSearchable
			isClearable={false}
			required={required}
		/>
	)

	if (!showSection) {
		return selectComponent
	}

	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
			<h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
				{t(sectionTitle)}
			</h3>
			{selectComponent}
		</div>
	)
}


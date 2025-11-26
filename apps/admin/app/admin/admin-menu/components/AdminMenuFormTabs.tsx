"use client"

import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import TextInput from "@/components/form/inputs/TextInput"
import Input from "@/components/form/inputs/TextInput"
import ReactSelect from "@/components/form/inputs/ReactSelect"
import { IconPicker } from "@/components/form"
import { useAdminLanguages } from "@/hooks/useAdminConfig"

import { AdminMenuFormTranslation } from "../types"

export interface AdminMenuFormTabsProps {
	currentLanguage: string
	translations: Record<string, AdminMenuFormTranslation>
	onTranslationChange: (lang: string, field: keyof AdminMenuFormTranslation, value: string) => void
	settings: {
		icon?: string | null
		path?: string | null
		module?: string | null
		type?: string | null
		group?: string | null
	}
	onSettingsChange: (changes: Partial<AdminMenuFormTabsProps["settings"]>) => void
	modules: { value: string; label: string }[]
	types: { value: string; label: string }[]
	isLoadingModules: boolean
	isLoadingTypes: boolean
	errors?: Record<string, string>
}

export function AdminMenuFormTabs({
	currentLanguage,
	translations,
	onTranslationChange,
	settings,
	onSettingsChange,
	modules,
	types,
	isLoadingModules,
	isLoadingTypes,
	errors = {},
}: AdminMenuFormTabsProps) {
	const { t } = useTranslation()
const { languages } = useAdminLanguages()
	const currentLanguageLabel = languages.find((lang) => lang.code === currentLanguage)?.name ?? currentLanguage.toUpperCase()

	const currentTranslation = translations[currentLanguage] ?? { name: "" }

	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
			{/* Translation Section */}
			<div className="space-y-6 mb-8">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-medium text-gray-900 dark:text-white">
						{t("common.tabs.translate")}
					</h3>
					<div className="flex items-center space-x-2">
						<span className="text-sm text-gray-500 dark:text-gray-400">
							{t("common.label.language")}
						</span>
				<span className="px-2 py-1 bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 rounded-md text-sm font-medium">
					{currentLanguageLabel}
				</span>
					</div>
				</div>

				<div className="space-y-4">
					<TextInput
						value={currentTranslation.name}
						onChange={(value) => onTranslationChange(currentLanguage, "name", value)}
						label={t("common.label.name")}
						placeholder={t("common.label.name")}
						required
						error={errors[`translations.${currentLanguage}.name`]}
					/>
				</div>
			</div>

			{/* Settings Section */}
			<div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-medium text-gray-900 dark:text-white">
						{t("common.sections.settings")}
					</h3>
				</div>

				<div className="space-y-4">
					<IconPicker
						id="icon"
						name="icon"
						label={t("admin.admin_menu.form.icon")}
						value={settings.icon || ""}
						onChange={(value) => onSettingsChange({ icon: value || null })}
						placeholder="GridIcon"
						error={errors.icon}
					/>

					<Input
						id="path"
						name="path"
						label={t("admin.admin_menu.form.path")}
						value={settings.path || ""}
						onChange={(value) => onSettingsChange({ path: value || null })}
						placeholder="/admin/banner"
						error={errors.path}
					/>

					<ReactSelect
						id="module"
						name="module"
						label={t("admin.admin_menu.form.module")}
						value={settings.module || ""}
						onChange={(value) => onSettingsChange({ module: value ? String(value) : null, type: null })}
						options={modules}
						placeholder={t("common.selectPlaceholder")}
						isClearable
						isSearchable
						isDisabled={isLoadingModules}
						loadingMessage={t("common.message.loading")}
						error={errors.module}
						required
					/>

					{settings.module && (
						<ReactSelect
							id="type"
							name="type"
							label={t("common.label.type")}
							value={settings.type || ""}
							onChange={(value) => onSettingsChange({ type: value ? String(value) : null })}
							options={types}
							placeholder={t("common.selectPlaceholder")}
							isClearable
							isSearchable
							isDisabled={isLoadingTypes}
							loadingMessage={t("common.message.loading")}
							error={errors.type}
							required
						/>
					)}

				<ReactSelect
					id="group"
					name="group"
					label={t("common.label.group")}
					value={settings.group || ""}
					onChange={(value) => onSettingsChange({ group: value ? String(value) : null })}
					options={[
						{ value: "view", label: t("common.group.view") },
						{ value: "add", label: t("common.group.create") },
						{ value: "edit", label: t("common.group.edit") },
						{ value: "delete", label: t("common.group.delete") },
					]}
					placeholder={t("common.selectPlaceholder")}
					isClearable
					isSearchable
					error={errors.group}
					required
				/>
				</div>
			</div>
		</div>
	)
}


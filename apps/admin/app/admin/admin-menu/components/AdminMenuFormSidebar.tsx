"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import ReactSelect from "@/components/form/inputs/ReactSelect"
import ToggleSwitch from "@/components/form/inputs/ToggleSwitch"
import { LanguageSelector, type LanguageOption } from "@/components/form/LanguageSelector"

import { adminMenuApiService } from "../api"
import { AdminMenuFormData } from "../types"

interface AdminMenuFormSidebarProps {
	formData: AdminMenuFormData
	onChange: (changes: Partial<AdminMenuFormData>) => void
	currentLanguage: string
	onLanguageChange: (lang: string) => void
	languages: LanguageOption[]
	currentMenuId?: number | null
	errors?: Record<string, string>
}

export function AdminMenuFormSidebar({
	formData,
	onChange,
	currentLanguage,
	onLanguageChange,
	languages,
	currentMenuId,
	errors = {},
}: AdminMenuFormSidebarProps) {
	const { t } = useTranslation()
	const [parentMenus, setParentMenus] = useState<{ value: string; label: string }[]>([])
	const [isLoadingParents, setIsLoadingParents] = useState(false)

	useEffect(() => {
		let isMounted = true
		
		async function loadParentMenus() {
			setIsLoadingParents(true)
			try {
				const response = await adminMenuApiService.getAll({
					page: 1,
					limit: 100,
					status: true,
				})
				
				if (!isMounted) return
				
				// Filter out current menu and its children
				const parentOptions = response.data
					.filter((menu) => menu.id !== currentMenuId)
					.map((menu) => {
						// Get name from translations (prefer current language, fallback to first available)
						const translate = menu.translates?.find((t) => t.lang === currentLanguage)
						const fallbackTranslate = menu.translates?.[0]
						const name = translate?.name || fallbackTranslate?.name || t("common.message.untitled")
						return {
							value: String(menu.id),
							label: name,
						}
					})
				setParentMenus([{ value: "", label: t("common.selectPlaceholder") }, ...parentOptions])
			} catch (error) {
				console.error("Failed to load parent menus", error)
			} finally {
				if (isMounted) {
					setIsLoadingParents(false)
				}
			}
		}
		
		loadParentMenus()
		
		return () => {
			isMounted = false
		}
	}, [currentMenuId, currentLanguage, t])

	return (
		<div className="flex-1 px-6">
			<div className="sticky top-0 space-y-6">
				<LanguageSelector
					currentLanguage={currentLanguage}
					onLanguageChange={onLanguageChange}
					languages={languages}
					showOnlyIfMultiple={true}
					showIfEnabled={true}
					id="admin-menu-language"
					name="adminMenuLanguage"
				/>

				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
					<h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
						{t("common.sections.settings")}
					</h3>
					<div className="space-y-4">
						<ReactSelect
							id="parentId"
							name="parentId"
							label={t("admin.admin_menu.form.parentMenu")}
							value={formData.parentId ? String(formData.parentId) : ""}
							onChange={(value) => onChange({ parentId: value ? Number(value) : null })}
							options={parentMenus}
							placeholder={t("common.selectPlaceholder")}
							isClearable
							isSearchable
							isDisabled={isLoadingParents}
							loadingMessage={t("common.message.loading")}
							error={errors.parentId}
						/>

						<ToggleSwitch
							checked={formData.status ?? true}
							onChange={(checked) => onChange({ status: checked })}
							label={t("common.label.status")}
							onLabel={t("common.table.status.active")}
							offLabel={t("common.table.status.inactive")}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}


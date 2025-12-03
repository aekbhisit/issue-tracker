"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"

import Button from "@/components/ui/button/Button"
import ConfirmModal from "@/components/ui/notification/ConfirmModal"
import ToastContainer from "@/components/ui/notification/ToastContainer"

import { useLoading } from "@/context/LoadingContext"
import { useNotification } from "@/hooks/useNotification"

import { adminMenuApiService, AdminMenuApiService } from "../api"
import { AdminMenu, AdminMenuFormData, AdminMenuFormTranslation } from "../types"
import { AdminMenuFormSidebar } from "./AdminMenuFormSidebar"
import { AdminMenuFormTabs } from "./AdminMenuFormTabs"
import { useAdminLanguages } from "@/hooks/useAdminConfig"
import { FormLayout } from "@/components/form/FormLayout"
import { useNavigationOverlay } from "@/hooks/useNavigationOverlay"

interface AdminMenuFormProps {
	initialMenu?: AdminMenu | null
	isEditMode?: boolean
}

export function AdminMenuForm({ initialMenu, isEditMode = false }: AdminMenuFormProps) {
	const { t } = useTranslation()
	const { showLoading, hideLoading } = useLoading()
	const { pushWithOverlay } = useNavigationOverlay()
	const notification = useNotification()
	const {
		toasts,
		confirmState,
		showError,
		showSuccess,
		showConfirm,
		removeToast,
		handleConfirm,
		handleCancel,
	} = notification

const { languages, languageCodes, defaultLanguage } = useAdminLanguages()
const [formData, setFormData] = useState<AdminMenuFormData>(() =>
	AdminMenuApiService.mapApiModelToFormData(initialMenu, languageCodes)
)
const [errors, setErrors] = useState<Record<string, string>>({})
const [isSubmitting, setIsSubmitting] = useState(false)
const [currentLanguage, setCurrentLanguage] = useState<string>(defaultLanguage)
const [isInitialized, setIsInitialized] = useState(false)
	const [modules, setModules] = useState<{ value: string; label: string }[]>([])
	const [types, setTypes] = useState<{ value: string; label: string }[]>([])
	const [isLoadingModules, setIsLoadingModules] = useState(false)
	const [isLoadingTypes, setIsLoadingTypes] = useState(false)

	// Scroll to top when form loads
	useEffect(() => {
		window.scrollTo(0, 0)
	}, [])

useEffect(() => {
	setCurrentLanguage((prev) => (languageCodes.includes(prev) ? prev : defaultLanguage))
}, [languageCodes, defaultLanguage])

useEffect(() => {
	if (!languageCodes.length || isInitialized) return
	if (initialMenu) {
		setFormData(AdminMenuApiService.mapApiModelToFormData(initialMenu, languageCodes))
	} else {
		setFormData(AdminMenuApiService.createEmptyFormData(languageCodes))
	}
	setIsInitialized(true)
}, [initialMenu, languageCodes, isInitialized])

useEffect(() => {
	if (languageCodes.length === 0) return
	setFormData((prev) => ({
		...prev,
		translations: AdminMenuApiService.ensureTranslations(prev.translations, languageCodes),
	}))
}, [languageCodes])

	useEffect(() => {
		async function loadModules() {
			setIsLoadingModules(true)
			try {
				const response = await adminMenuApiService.getModules()
				const moduleOptions = response.modules.map((module) => ({
					value: module,
					label: module,
				}))
				setModules(moduleOptions)
			} catch (error) {
				console.error("Failed to load modules", error)
			} finally {
				setIsLoadingModules(false)
			}
		}
		loadModules()
	}, [])

	useEffect(() => {
		async function loadTypes() {
			if (!formData.module) {
				setTypes([])
				return
			}
			setIsLoadingTypes(true)
			try {
				const response = await adminMenuApiService.getTypes(formData.module)
				const typeOptions = response.types.map((type) => ({
					value: type,
					label: type,
				}))
				setTypes(typeOptions)
			} catch (error) {
				console.error("Failed to load types", error)
			} finally {
				setIsLoadingTypes(false)
			}
		}
		loadTypes()
	}, [formData.module])

	const handleSidebarChange = (changes: Partial<AdminMenuFormData>) => {
		setFormData((prev) => ({
			...prev,
			...changes,
		}))
		// Clear errors for changed fields
		if (Object.keys(changes).length > 0) {
			setErrors((prev) => {
				const next = { ...prev }
				Object.keys(changes).forEach((key) => {
					delete next[key]
				})
				return next
			})
		}
	}

	const handleTranslationChange = (
		lang: string,
		field: keyof AdminMenuFormTranslation,
		value: string
	) => {
		setFormData((prev) => ({
			...prev,
			translations: {
				...prev.translations,
				[lang]: {
					...prev.translations[lang],
					[field]: value,
				},
			},
		}))
		// Clear error for this field
		setErrors((prev) => {
			const next = { ...prev }
			delete next[`translations.${lang}.${field}`]
			return next
		})
	}

	const handleSettingsChange = (changes: Partial<AdminMenuFormData>) => {
		setFormData((prev) => ({
			...prev,
			...changes,
		}))
		// Clear errors for changed fields
		if (Object.keys(changes).length > 0) {
			setErrors((prev) => {
				const next = { ...prev }
				Object.keys(changes).forEach((key) => {
					delete next[key]
				})
				return next
			})
		}
	}

	const validateForm = (): boolean => {
	const newErrors: Record<string, string> = {}
		let firstErrorLanguage: string | null = null

		// Validate translations
	languageCodes.forEach((lang) => {
			const translation = formData.translations[lang]
			if (!translation || !translation.name || translation.name.trim() === "") {
				newErrors[`translations.${lang}.name`] = t("common.error.required")
				if (!firstErrorLanguage) {
					firstErrorLanguage = lang
				}
			}
		})

		// Validate path (if provided, must start with /)
		if (formData.path) {
			const path = formData.path.trim()
			if (path && !path.startsWith("/")) {
				newErrors.path = t("admin.admin_menu.error.pathFormat")
			}
		}

		// Validate module (required)
		if (!formData.module || formData.module.trim() === "") {
			newErrors.module = t("common.error.required")
		}

		// Validate type (required)
		if (!formData.type || formData.type.trim() === "") {
			newErrors.type = t("common.error.required")
		}

		// Validate group (required)
		if (!formData.group || formData.group.trim() === "") {
			newErrors.group = t("common.error.required")
		}

		setErrors(newErrors)
		if (Object.keys(newErrors).length > 0) {
			// Switch to the language with the first error
			if (firstErrorLanguage && firstErrorLanguage !== currentLanguage) {
				setCurrentLanguage(firstErrorLanguage)
			}
			return false
		}

		return true
	}

	const handleSave = async () => {
		if (!validateForm()) {
			showError({ message: t("common.message.error") })
			return
		}

		setIsSubmitting(true)
		showLoading(t("common.message.loading"))

		try {
			if (isEditMode && initialMenu) {
				await adminMenuApiService.update(initialMenu.id, formData)
				showSuccess({ message: t("common.message.updateSuccess") })
			} else {
				await adminMenuApiService.create(formData)
				showSuccess({ message: t("common.message.createSuccess") })
			}

			// Redirect (don't hide loader - let it continue during redirect)
			pushWithOverlay("/admin-menu")
			// Reset submitting state after successful save
			setIsSubmitting(false)
		} catch (error) {
			// Hide loader and show error notification
			hideLoading()
			setIsSubmitting(false)
			showError({ message: (error as Error).message || t("common.message.error") })
		}
	}

	const handleCancelClick = () => {
		showConfirm({
			title: t("common.message.confirmCancelTitle"),
			message: t("common.message.confirmCancelMessage"),
			onConfirm: () => {
				pushWithOverlay("/admin-menu")
			},
		})
	}

	return (
		<>
			<FormLayout
				title={isEditMode ? t("admin.admin_menu.form.editTitle") : t("admin.admin_menu.form.addTitle")}
				description={t("admin.admin_menu.form.description")}
				actions={
					<>
						<Button
							variant="outline"
							onClick={handleCancelClick}
							disabled={isSubmitting}
							className="w-full min-w-[140px] sm:w-auto"
						>
							{t("common.button.cancel")}
						</Button>
						<Button
							onClick={handleSave}
							disabled={isSubmitting}
							className="w-full min-w-[140px] sm:w-auto"
						>
							{isSubmitting ? t("common.message.loading") : t("common.button.save")}
						</Button>
					</>
				}
				sidebar={
					<div className="lg:sticky lg:top-24">
						<AdminMenuFormSidebar
							formData={formData}
							onChange={handleSidebarChange}
							currentLanguage={currentLanguage}
							onLanguageChange={setCurrentLanguage}
							currentMenuId={isEditMode && initialMenu ? initialMenu.id : null}
							errors={errors}
							languages={languages}
						/>
					</div>
				}
			>
				<div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800/70 dark:bg-gray-900/40 sm:p-6">
					<AdminMenuFormTabs
						currentLanguage={currentLanguage}
						translations={formData.translations}
						onTranslationChange={handleTranslationChange}
						settings={{
							icon: formData.icon,
							path: formData.path,
							module: formData.module,
							type: formData.type,
							group: formData.group,
						}}
						onSettingsChange={handleSettingsChange}
						modules={modules}
						types={types}
						isLoadingModules={isLoadingModules}
						isLoadingTypes={isLoadingTypes}
						errors={errors}
					/>
				</div>
			</FormLayout>

			<ToastContainer toasts={toasts} onRemoveToast={removeToast} />
			<ConfirmModal
				isOpen={confirmState.isOpen}
				title={confirmState.title}
				message={confirmState.message}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
			/>
		</>
	)
}


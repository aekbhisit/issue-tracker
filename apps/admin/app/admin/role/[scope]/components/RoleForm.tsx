"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import Button from "@/components/ui/button/Button"
import { FormLayout } from "@/components/form/FormLayout"
import ToastContainer from "@/components/ui/notification/ToastContainer"
import ConfirmModal from "@/components/ui/notification/ConfirmModal"
import TextInput from "@/components/form/inputs/TextInput"
import ToggleSwitch from "@/components/form/inputs/ToggleSwitch"

import { useLoading } from "@/context/LoadingContext"
import { useNotification } from "@/hooks/useNotification"
import { useNavigationOverlay } from "@/hooks/useNavigationOverlay"
import { logger } from "@workspace/utils"

import { RoleApiService } from "../api"
import { PermissionSummarySet, Role, RoleFormData } from "../types"
import { RolePermissionPicker } from "./RolePermissionPicker"

interface RoleFormProps {
	scope: string
	initialRole?: Role | null
	permissionSets: PermissionSummarySet[]
	isEditMode?: boolean
}

const createInitialFormData = (scope: string, role?: Role | null): RoleFormData => ({
	name: role?.name ?? "",
	status: role?.status ?? true,
	permissions: role?.permissions ?? [],
	scope,
})

export function RoleForm({ scope, initialRole, permissionSets, isEditMode = false }: RoleFormProps) {
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
		handleCancel: handleConfirmCancel,
	} = notification

	const [formData, setFormData] = useState<RoleFormData>(() => createInitialFormData(scope, initialRole))
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)

	const selectedPermissions = useMemo(() => new Set(formData.permissions), [formData.permissions])

	useEffect(() => {
		setFormData(createInitialFormData(scope, initialRole))
		setErrors({})
	}, [initialRole, scope])

	const validateForm = (): boolean => {
		const validationErrors: Record<string, string> = {}
		const nameValue = formData.name.trim()

		if (!nameValue) {
			validationErrors.name = t("common.error.required")
		}

		setErrors(validationErrors)
		if (Object.keys(validationErrors).length > 0) {
			showError({ message: t("admin.role.form.validationError") })
			return false
		}
		return true
	}

	const handleInputChange = <K extends keyof RoleFormData>(field: K, value: RoleFormData[K]) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}))
		setErrors((prev) => {
			const next = { ...prev }
			delete next[field as string]
			return next
		})
	}

	const handlePermissionsChange = (permissionIds: number[]) => {
		handleInputChange("permissions", permissionIds)
	}

	const handleSave = async () => {
		if (isSubmitting) return
		if (!validateForm()) return

		setIsSubmitting(true)
		showLoading(t("common.message.loading"))

		try {
			if (isEditMode && initialRole) {
				await RoleApiService.updateRole(Number(initialRole.id), formData)
				showSuccess({ message: t("admin.role.form.updateSuccess") })
			} else {
				const response = await RoleApiService.createRole(formData)
				const createdName = response.data?.name ?? formData.name
				showSuccess({
					message: t("admin.role.form.createSuccess", {
						name: createdName,
					}),
				})
			}
			// Redirect (don't hide loader - let it continue during redirect)
			pushWithOverlay(`/admin/role/${scope}`)
			// Reset submitting state after successful save
			setIsSubmitting(false)
		} catch (error) {
			// Hide loader and show error notification
			hideLoading()
			setIsSubmitting(false)
			logger.error("Failed to save role", error)
			showError({ message: (error as Error).message || t("admin.role.form.errorSave") })
		}
	}

	const handleCancel = () => {
		showConfirm({
			title: t("admin.role.form.confirmCancelTitle"),
			message: t("admin.role.form.confirmCancelMessage"),
			confirmText: t("admin.role.form.confirmCancelConfirm"),
			cancelText: t("common.button.cancel"),
			onConfirm: () => pushWithOverlay(`/admin/role/${scope}`),
		})
	}

	return (
		<>
			<FormLayout
				title={
					isEditMode
						? t("admin.role.form.editTitle")
						: t("admin.role.form.addTitle")
				}
				description={t("admin.role.form.description")}
				actions={
					<>
						<Button
							variant="outline"
							onClick={handleCancel}
							disabled={isSubmitting}
							className="w-full min-w-[120px] sm:w-auto"
						>
							{t("common.button.cancel")}
						</Button>
						<Button
							onClick={handleSave}
							disabled={isSubmitting}
							className="w-full min-w-[120px] sm:w-auto"
						>
							{isSubmitting ? t("common.message.loading") : t("common.button.save")}
						</Button>
					</>
				}
				sidebar={
					<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900/40">
						<h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
							{t("common.sections.settings")}
						</h3>
						<ToggleSwitch
							checked={formData.status}
							onChange={(checked) => handleInputChange("status", checked)}
							label={t("common.label.status")}
							onLabel={t("common.table.status.active")}
							offLabel={t("common.table.status.inactive")}
						/>
					</div>
				}
			>
				<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900/40 space-y-6">
					<TextInput
						value={formData.name}
						onChange={(value) => handleInputChange("name", value)}
						label={t("admin.role.form.fields.name")}
						placeholder={t("admin.role.form.placeholders.name")}
						error={errors.name}
						required
					/>
					<RolePermissionPicker
						scope={scope}
						permissionSets={permissionSets}
						selectedPermissionIds={formData.permissions}
						onChange={handlePermissionsChange}
					/>
				</div>
			</FormLayout>

			<ToastContainer toasts={toasts} onRemoveToast={removeToast} />
			<ConfirmModal
				isOpen={confirmState.isOpen}
				title={confirmState.title}
				message={confirmState.message}
				confirmText={confirmState.confirmText}
				cancelText={confirmState.cancelText}
				onConfirm={handleConfirm}
				onCancel={handleConfirmCancel}
			/>
		</>
	)
}



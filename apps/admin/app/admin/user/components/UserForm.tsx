"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import ToastContainer from "@/components/ui/notification/ToastContainer";
import ConfirmModal from "@/components/ui/notification/ConfirmModal";
import ReactSelect from "@/components/form/inputs/ReactSelect";
import ToggleSwitch from "@/components/form/inputs/ToggleSwitch";
import TextInput from "@/components/form/inputs/TextInput";
import FileUpload from "@/components/form/upload/FileUpload";
import { FormLayout } from "@/components/form/FormLayout";
import { useNavigationOverlay } from "@/hooks/useNavigationOverlay";

import { useLoading } from "@/context/LoadingContext";
import { useNotification } from "@/hooks/useNotification";
import { logger } from "@workspace/utils";

import { mapUserFromApi, userApiService } from "../api";
import type { User, UserFormData, UserRoleOption, UserAvatar } from "../types";

interface UserFormProps {
	initialUser?: User | null;
	roles: UserRoleOption[];
	isEditMode?: boolean;
}

export function UserForm({ initialUser, roles, isEditMode = false }: UserFormProps) {
	const { t } = useTranslation();
	const { showLoading, hideLoading } = useLoading();
	const { pushWithOverlay } = useNavigationOverlay();
	const notification = useNotification();
	const {
		toasts,
		confirmState,
		showError,
		showSuccess,
		showConfirm,
		removeToast,
		handleConfirm,
		handleCancel: handleConfirmCancel,
	} = notification;

	const initialFormState = useMemo<UserFormData>(
		() => ({
			roleId: initialUser?.roleId ?? null,
			name: initialUser?.name ?? "",
			username: initialUser?.username ?? "",
			email: initialUser?.email ?? "",
			password: "",
			lang: initialUser?.lang ?? "en",
			status: initialUser?.status ?? true,
			avatar: initialUser?.avatar ?? null,
		}),
		[initialUser],
	);

	const [formData, setFormData] = useState<UserFormData>(initialFormState);
	const [confirmPassword, setConfirmPassword] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setFormData(initialFormState);
		setConfirmPassword("");
		setErrors({});
	}, [initialFormState]);

	const handleInputChange = <K extends keyof UserFormData>(field: K, value: UserFormData[K]) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
		setErrors((prev) => {
			const next = { ...prev };
			delete next[field as string];
			if (field === "password") {
				delete next.confirmPassword;
			}
			return next;
		});
	};

	const clearAvatarErrors = () => {
		setErrors((prev) => {
			let shouldUpdate = false;
			const next: Record<string, string> = { ...prev };
			Object.keys(next).forEach((key) => {
				if (key === "avatar" || key.startsWith("avatar.")) {
					delete next[key];
					shouldUpdate = true;
				}
			});
			return shouldUpdate ? next : prev;
		});
	};

	const handleAvatarFileChange = (value: [string, string] | null) => {
		setFormData((prev) => {
			if (!value || !value[0] || value[0].trim().length === 0) {
				return {
					...prev,
					avatar: null,
				};
			}

			const [src, alt] = value;
			return {
				...prev,
				avatar: {
					src: src?.trim() || null,
					alt: alt?.trim() || prev.avatar?.alt || null,
				},
			};
		});
		clearAvatarErrors();
	};

	const handleAvatarAltChange = (value: string) => {
		const trimmed = typeof value === "string" ? value.trim() : "";
		setFormData((prev) => {
			const currentSrc = prev.avatar?.src ?? null;
			if (!currentSrc && trimmed.length === 0) {
				return {
					...prev,
					avatar: null,
				};
			}
			return {
				...prev,
				avatar: {
					src: currentSrc,
					alt: trimmed.length > 0 ? trimmed : null,
				},
			};
		});
		clearAvatarErrors();
	};

	const handleConfirmPasswordChange = (value: string) => {
		setConfirmPassword(value);
		setErrors((prev) => {
			if (!prev.confirmPassword) return prev;
			const next = { ...prev };
			delete next.confirmPassword;
			return next;
		});
	};

	const validateForm = (): boolean => {
		const validationErrors: Record<string, string> = {};
		const nameValue = formData.name?.trim() ?? "";
		const usernameValue = formData.username?.trim() ?? "";
		const emailValue = formData.email?.trim() ?? "";
		const passwordValue = formData.password?.trim() ?? "";
		const confirmValue = confirmPassword.trim();

		const usernamePattern = /^[A-Za-z0-9]+$/;
		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const passwordPattern = /^[A-Za-z0-9!@#$%]{8,15}$/;

		if (!nameValue) {
			validationErrors.name = t("common.error.required");
		}
		if (!usernameValue) {
			validationErrors.username = t("common.error.required");
		} else if (!usernamePattern.test(usernameValue)) {
			validationErrors.username = t("admin.user.form.errors.usernameInvalid");
		}
		if (!emailValue) {
			validationErrors.email = t("common.error.required");
		} else if (!emailPattern.test(emailValue)) {
			validationErrors.email = t("admin.user.form.errors.emailInvalid");
		}

		if (passwordValue) {
			if (!passwordPattern.test(passwordValue)) {
				validationErrors.password = t("admin.user.form.errors.passwordInvalid");
			}
			if (!confirmValue) {
				validationErrors.confirmPassword = t("admin.user.form.errors.confirmPasswordRequired");
			} else if (passwordValue !== confirmValue) {
				validationErrors.confirmPassword = t("admin.user.form.errors.passwordMismatch");
			}
		} else if (confirmValue) {
			validationErrors.confirmPassword = t("admin.user.form.errors.passwordMismatch");
		}

		setErrors(validationErrors);
		return Object.keys(validationErrors).length === 0;
	};

	const sanitizeAvatarForPayload = (avatar: UserAvatar | null): UserAvatar | null => {
		if (!avatar) {
			return null;
		}
		const src = typeof avatar.src === "string" ? avatar.src.trim() : null;
		const normalizedSrc = src && src.length > 0 ? src : null;
		const alt = typeof avatar.alt === "string" ? avatar.alt.trim() : null;
		const normalizedAlt = alt && alt.length > 0 ? alt : null;
		if (!normalizedSrc) {
			return null;
		}
		return {
			src: normalizedSrc,
			alt: normalizedAlt,
		};
	};

	const buildPayload = (): UserFormData => {
		const sanitizedAvatar = sanitizeAvatarForPayload(formData.avatar ?? null);
		return {
			roleId: formData.roleId,
			name: formData.name.trim(),
			username: formData.username.trim(),
			email: formData.email.trim(),
			password: formData.password && formData.password.trim().length > 0 ? formData.password.trim() : undefined,
			lang: formData.lang,
			status: formData.status,
			avatar: sanitizedAvatar,
		};
	};

	const handleSave = async () => {
		if (isSubmitting) return;
		if (!validateForm()) {
			showError({ message: t("admin.user.form.errors.validation") });
			return;
		}

		setIsSubmitting(true);
		showLoading(t("common.message.loading"));

		try {
			const payload = buildPayload();
			if (isEditMode && initialUser) {
				await userApiService.updateUser(parseInt(initialUser.id, 10), payload);
				showSuccess({ message: t("admin.user.form.successUpdate") });
			} else {
				const response = await userApiService.createUser(payload);
				const created = mapUserFromApi(response.data);
				showSuccess({ message: t("admin.user.form.successCreate", { name: created.name || created.email }) });
			}
			// Redirect (don't hide loader - let it continue during redirect)
			pushWithOverlay("/user");
			// Reset submitting state after successful save
			setIsSubmitting(false);
		} catch (error) {
			// Hide loader and show error notification
			hideLoading();
			setIsSubmitting(false);
			logger.error("Failed to save user", error);
			showError({
				message: (error as Error).message || t("admin.user.form.errorSave"),
			});
		}
	};

	const handleCancelClick = () => {
		showConfirm({
			title: t("admin.user.form.confirmCancelTitle"),
			message: t("admin.user.form.confirmCancelMessage"),
			confirmText: t("admin.user.form.confirmCancelConfirm"),
			cancelText: t("common.button.cancel"),
			onConfirm: () => pushWithOverlay("/user"),
		});
	};

	const roleOptions = useMemo(
		() => roles.map((role) => ({ value: role.id, label: role.name })),
		[roles],
	);

	return (
		<>
			<FormLayout
				title={isEditMode ? t("admin.user.form.editTitle") : t("admin.user.form.addTitle")}
				description={t("admin.user.form.description")}
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
					<div className="lg:sticky lg:top-24 space-y-6">
						<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900/40">
							<h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
								{t("common.sections.settings")}
							</h3>
							<div className="space-y-4">
								<ReactSelect
									id="user-role"
									label={t("admin.user.form.fields.role")}
									value={formData.roleId ?? undefined}
									onChange={(value) => {
										if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
											handleInputChange("roleId", null);
											return;
										}
										const resolvedValue = Array.isArray(value) ? value[0] : value;
										const numericValue = typeof resolvedValue === "string" ? parseInt(resolvedValue, 10) : resolvedValue;
										handleInputChange(
											"roleId",
											typeof numericValue === "number" && !Number.isNaN(numericValue) ? Number(numericValue) : null,
										);
									}}
									options={roleOptions}
									placeholder={t("admin.user.form.placeholders.role")}
									noOptionsMessage={t("common.noOptions")}
									loadingMessage={t("common.message.loading")}
									isClearable={false}
									isSearchable
									required={true}
								/>
								<ToggleSwitch
									checked={formData.status}
									onChange={(checked) => handleInputChange("status", checked)}
									label={t("common.label.status")}
									onLabel={t("common.table.status.active")}
									offLabel={t("common.table.status.inactive")}
								/>
							</div>
						</div>
					</div>
				}
			>
				<div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900/40">
					<TextInput
						value={formData.name}
						onChange={(value) => handleInputChange("name", value)}
						label={t("admin.user.form.fields.name")}
						placeholder={t("admin.user.form.placeholders.name")}
						error={errors.name}
						required
					/>
					<TextInput
						value={formData.username}
						onChange={(value) => handleInputChange("username", value)}
						label={t("admin.user.form.fields.username")}
						placeholder={t("admin.user.form.placeholders.username")}
						error={errors.username}
						required
					/>
					<TextInput
						value={formData.email}
						onChange={(value) => handleInputChange("email", value)}
						type="email"
						label={t("admin.user.form.fields.email")}
						placeholder={t("admin.user.form.placeholders.email")}
						error={errors.email}
						required
					/>
					<FileUpload
						value={formData.avatar ? [formData.avatar.src || "", formData.avatar.alt || ""] : null}
						onChange={handleAvatarFileChange}
						label={t("admin.user.form.fields.avatar")}
						helperText={t("admin.user.form.placeholders.avatar")}
						uploadType="image"
						existingFile={initialUser?.avatar?.src ?? undefined}
						error={errors.avatar}
						altValue={formData.avatar?.alt ?? ""}
						onAltChange={handleAvatarAltChange}
						altLabel={t("admin.user.form.fields.avatarAlt")}
						altPlaceholder={t("admin.user.form.placeholders.avatarAlt")}
						altHelperText={t("admin.user.form.helpers.avatarAlt")}
					/>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<TextInput
							value={formData.password ?? ""}
							onChange={(value) => handleInputChange("password", value)}
							type="password"
							label={t("admin.user.form.fields.password")}
							placeholder={t("admin.user.form.placeholders.password")}
							autoComplete="new-password"
							name="new-password"
							error={errors.password}
						/>
						<TextInput
							value={confirmPassword}
							onChange={handleConfirmPasswordChange}
							type="password"
							label={t("admin.user.form.fields.confirmPassword")}
							placeholder={t("admin.user.form.placeholders.confirmPassword")}
							autoComplete="new-password"
							name="confirm-new-password"
							error={errors.confirmPassword}
						/>
					</div>
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
	);
}



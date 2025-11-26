"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import TextInput from "@/components/form/inputs/TextInput";
import TextareaInput from "@/components/form/inputs/TextareaInput";
import ReactSelect from "@/components/form/inputs/ReactSelect";
import ToggleSwitch from "@/components/form/inputs/ToggleSwitch";
import { FormLayout } from "@/components/form/FormLayout";
import { useNotification } from "@/hooks/useNotification";

import type { Project, ProjectFormData, ProjectEnvironment, EnvironmentFormData } from "../types";
import { EmbedScriptSection } from "./EmbedScriptSection";

interface ProjectFormProps {
	initialProject?: Project | null;
	isEditMode?: boolean;
	onSubmit: (data: ProjectFormData) => Promise<void>;
	onCancel?: () => void;
}

export function ProjectForm({ initialProject, isEditMode = false, onSubmit, onCancel }: ProjectFormProps) {
	const { t } = useTranslation();
	const notification = useNotification();
	const { showError } = notification;
	
	const environmentsDescription = t("admin.project.form.environmentsDescription") || 
		"Configure different deployment stages (dev, staging, prod) with separate API URLs and allowed origins. Environments are optional and allow you to manage project settings for different deployment stages.";

	const initialFormState = useMemo<ProjectFormData>(
		() => ({
			name: initialProject?.name || "",
			description: initialProject?.description || "",
			allowedDomains: initialProject?.allowedDomains || [],
			status: initialProject?.status ?? true,
			environments: initialProject?.environments?.map((env) => ({
				name: env.name,
				apiUrl: env.apiUrl || "",
				allowedOrigins: env.allowedOrigins || [],
				isActive: env.isActive ?? true,
			})),
		}),
		[initialProject]
	);

	const [formData, setFormData] = useState<ProjectFormData>(initialFormState);
	const [domainInput, setDomainInput] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingEnvIndex, setEditingEnvIndex] = useState<number | null>(null);
	const [envFormData, setEnvFormData] = useState<EnvironmentFormData>({
		name: "",
		apiUrl: "",
		allowedOrigins: [],
		isActive: true,
	});

	useEffect(() => {
		setFormData(initialFormState);
		setDomainInput("");
		setErrors({});
		setEditingEnvIndex(null);
		setEnvFormData({
			name: "",
			apiUrl: "",
			allowedOrigins: [],
			isActive: true,
		});
	}, [initialFormState]);

	const handleInputChange = <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
		setErrors((prev) => {
			const next = { ...prev };
			delete next[field as string];
			return next;
		});
	};

	const validateDomain = (domain: string): boolean => {
		const trimmed = domain.trim();
		if (trimmed.length === 0) return false;

		// Check for wildcard pattern
		if (trimmed.startsWith("*.")) {
			const domainPart = trimmed.substring(2);
			if (domainPart.length === 0) return false;
			const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
			return domainRegex.test(domainPart);
		}

		// Exact domain match
		const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.[a-z]{2,}$/i;
		return domainRegex.test(trimmed);
	};

	const handleAddDomain = () => {
		const trimmed = domainInput.trim();
		if (!trimmed) return;

		if (!validateDomain(trimmed)) {
			showError({
				message: `Invalid domain format: ${trimmed}. Use format like example.com or *.example.com`,
			});
			return;
		}

		if (formData.allowedDomains.includes(trimmed)) {
			showError({
				message: "Domain already added",
			});
			return;
		}

		setFormData((prev) => ({
			...prev,
			allowedDomains: [...prev.allowedDomains, trimmed],
		}));
		setDomainInput("");
		setErrors((prev) => {
			const next = { ...prev };
			delete next.allowedDomains;
			return next;
		});
	};

	const handleRemoveDomain = (index: number) => {
		setFormData((prev) => ({
			...prev,
			allowedDomains: prev.allowedDomains.filter((_, i) => i !== index),
		}));
	};

	const handleAddEnvironment = () => {
		if (!envFormData.name.trim()) {
			showError({
				message: "Environment name is required",
			});
			return;
		}

		const validNames = ["dev", "staging", "prod", "test", "development", "production"];
		if (!validNames.includes(envFormData.name.toLowerCase())) {
			showError({
				message: `Environment name must be one of: ${validNames.join(", ")}`,
			});
			return;
		}

		const existingEnvs = formData.environments || [];
		if (existingEnvs.some((e) => e.name.toLowerCase() === envFormData.name.toLowerCase())) {
			showError({
				message: "Environment with this name already exists",
			});
			return;
		}

		setFormData((prev) => ({
			...prev,
			environments: [...(prev.environments || []), { ...envFormData }],
		}));

		setEnvFormData({
			name: "",
			apiUrl: "",
			allowedOrigins: [],
			isActive: true,
		});
	};

	const handleEditEnvironment = (index: number) => {
		const env = formData.environments?.[index];
		if (env) {
			setEnvFormData({
				name: env.name,
				apiUrl: env.apiUrl || "",
				allowedOrigins: env.allowedOrigins || [],
				isActive: env.isActive ?? true,
			});
			setEditingEnvIndex(index);
		}
	};

	const handleUpdateEnvironment = () => {
		if (editingEnvIndex === null) return;

		if (!envFormData.name.trim()) {
			showError({
				message: "Environment name is required",
			});
			return;
		}

		const validNames = ["dev", "staging", "prod", "test", "development", "production"];
		if (!validNames.includes(envFormData.name.toLowerCase())) {
			showError({
				message: `Environment name must be one of: ${validNames.join(", ")}`,
			});
			return;
		}

		const existingEnvs = formData.environments || [];
		const conflictIndex = existingEnvs.findIndex(
			(e, i) => i !== editingEnvIndex && e.name.toLowerCase() === envFormData.name.toLowerCase()
		);
		if (conflictIndex !== -1) {
			showError({
				message: "Environment with this name already exists",
			});
			return;
		}

		setFormData((prev) => {
			const newEnvs = [...(prev.environments || [])];
			newEnvs[editingEnvIndex] = { ...envFormData };
			return {
				...prev,
				environments: newEnvs,
			};
		});

		setEditingEnvIndex(null);
		setEnvFormData({
			name: "",
			apiUrl: "",
			allowedOrigins: [],
			isActive: true,
		});
	};

	const handleRemoveEnvironment = (index: number) => {
		setFormData((prev) => ({
			...prev,
			environments: prev.environments?.filter((_, i) => i !== index) || [],
		}));
		if (editingEnvIndex === index) {
			setEditingEnvIndex(null);
			setEnvFormData({
				name: "",
				apiUrl: "",
				allowedOrigins: [],
				isActive: true,
			});
		}
	};

	const handleCancelEditEnv = () => {
		setEditingEnvIndex(null);
		setEnvFormData({
			name: "",
			apiUrl: "",
			allowedOrigins: [],
			isActive: true,
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validation
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = "Project name is required";
		}

		if (formData.allowedDomains.length === 0) {
			newErrors.allowedDomains = "At least one allowed domain is required";
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		setIsSubmitting(true);
		try {
			await onSubmit(formData);
		} catch (error) {
			// Error handling is done in parent component
		} finally {
			setIsSubmitting(false);
		}
	};

	const sidebarContent = isEditMode && initialProject ? (
		<div className="space-y-4">
			<div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
				<h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Project Keys</h3>
				<div className="space-y-3">
					<div>
						<label className="text-xs font-medium text-gray-500 dark:text-gray-400">Public Key</label>
						<div className="mt-1 flex items-center gap-2">
							<code className="flex-1 rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-900 dark:bg-gray-900 dark:text-gray-100">
								{initialProject.publicKey}
							</code>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									navigator.clipboard.writeText(initialProject.publicKey);
									notification.showSuccess({
										message: "Public key copied to clipboard",
									});
								}}
							>
								Copy
							</Button>
						</div>
					</div>
					<div>
						<label className="text-xs font-medium text-gray-500 dark:text-gray-400">Private Key</label>
						<div className="mt-1 flex items-center gap-2">
							<code className="flex-1 rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-900 dark:bg-gray-900 dark:text-gray-100">
								{initialProject.privateKey}
							</code>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									navigator.clipboard.writeText(initialProject.privateKey);
									notification.showSuccess({
										message: "Private key copied to clipboard",
									});
								}}
							>
								Copy
							</Button>
						</div>
					</div>
				</div>
			</div>
			
			{/* Embed Script Section */}
			{initialProject.publicKey && (
				<EmbedScriptSection project={initialProject} />
			)}
		</div>
	) : undefined;

	const formRef = useRef<HTMLFormElement>(null);

	const handleFormSubmit = () => {
		if (formRef.current) {
			// Trigger form submission by calling handleSubmit directly
			const syntheticEvent = {
				preventDefault: () => {},
				stopPropagation: () => {},
			} as React.FormEvent;
			handleSubmit(syntheticEvent);
		}
	};

	const breadcrumbs = [
		{ label: t("common.label.dashboard") || "Dashboard", href: "/admin/dashboard" },
		{ label: t("common.label.projects") || "Projects", href: "/admin/projects" },
		{ 
			label: isEditMode 
				? (initialProject?.name ? `${t("admin.project.form.editTitle") || "Edit"} ${initialProject.name}` : t("admin.project.form.editTitle") || "Edit Project")
				: t("admin.project.form.addTitle") || "Create New Project"
		},
	];

	return (
		<FormLayout
			title={isEditMode ? t("admin.project.form.editTitle") || "Edit Project" : t("admin.project.form.addTitle") || "Create New Project"}
			description={isEditMode ? t("admin.project.form.editDescription") || "Update project details and settings" : t("admin.project.form.addDescription") || "Register a new project for issue collection"}
			breadcrumbs={breadcrumbs}
			sidebar={sidebarContent}
		>
			<form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
				{/* Basic Information */}
				<div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t("admin.project.form.basicInformation") || "Basic Information"}</h3>
					<div className="space-y-4">
						<TextInput
							label={t("admin.project.form.projectName") || "Project Name"}
							value={formData.name}
							onChange={(value) => handleInputChange("name", value)}
							required
							error={errors.name}
							placeholder={t("admin.project.form.projectNamePlaceholder") || "Enter project name"}
						/>

						<TextareaInput
							label={t("common.label.description") || "Description"}
							value={formData.description}
							onChange={(value) => handleInputChange("description", value)}
							placeholder={t("admin.project.form.descriptionPlaceholder") || "Enter project description (optional)"}
							rows={3}
						/>

						<ToggleSwitch
							checked={formData.status}
							onChange={(checked) => handleInputChange("status", checked)}
							label={t("common.label.status") || "Status"}
							onLabel={t("admin.project.form.active") || "Active"}
							offLabel={t("admin.project.form.inactive") || "Inactive"}
						/>
					</div>
				</div>

				{/* Allowed Domains */}
				<div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t("admin.project.form.allowedDomains") || "Allowed Domains"}</h3>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								{t("admin.project.form.allowedDomains") || "Add Domain"} <span className="text-red-500">*</span>
							</label>
							<div className="flex gap-2">
								<div className="flex-1">
									<TextInput
										value={domainInput}
										onChange={setDomainInput}
										placeholder={t("admin.project.form.allowedDomainsPlaceholder") || "example.com or *.example.com"}
									/>
								</div>
								<Button type="button" onClick={handleAddDomain} variant="primary" size="sm">
									{t("common.button.create") || "Add"}
								</Button>
							</div>
							<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
								{t("admin.project.form.allowedDomainsHelper") || "Enter exact domain (e.g., app.example.com) or wildcard (e.g., *.example.com)"}
							</p>
						</div>

						{formData.allowedDomains.length > 0 && (
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									{t("admin.project.form.allowedDomains") || "Allowed Domains"} ({formData.allowedDomains.length})
								</label>
								<div className="space-y-2">
									{formData.allowedDomains.map((domain, index) => (
										<div
											key={index}
											className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
										>
											<span className="font-mono text-sm text-gray-900 dark:text-white">{domain}</span>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => handleRemoveDomain(index)}
												className="text-red-600 hover:text-red-700"
											>
												{t("admin.project.form.remove") || "Remove"}
											</Button>
										</div>
									))}
								</div>
							</div>
						)}
						{errors.allowedDomains && (
							<p className="text-sm text-red-600 dark:text-red-400">{errors.allowedDomains}</p>
						)}
					</div>
				</div>

				{/* Environments */}
				<div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
					<div className="mb-4">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t("admin.project.form.environments") || "Environments"}</h3>
						<p className="text-xs text-gray-500 dark:text-gray-400">
							{environmentsDescription}
						</p>
					</div>
					<div className="space-y-4">
						{/* Environment Form */}
						<div className="rounded border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
							<h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
								{editingEnvIndex !== null ? t("admin.project.form.editEnvironment") || "Edit Environment" : t("admin.project.form.addEnvironment") || "Add Environment"}
							</h4>
							{/* Compact single-line form */}
							<div className="flex flex-col sm:flex-row gap-3 items-end w-full overflow-x-auto">
								<div className="flex-1 min-w-0 sm:min-w-[140px] max-w-full">
									<ReactSelect
										label={t("admin.project.form.environmentName") || "Environment Name"}
										value={envFormData.name}
										onChange={(value) =>
											setEnvFormData((prev) => ({
												...prev,
												name: typeof value === "string" ? value : "",
											}))
										}
										options={[
											{ value: "dev", label: t("admin.project.form.environment.dev") || "Development" },
											{ value: "staging", label: t("admin.project.form.environment.staging") || "Staging" },
											{ value: "prod", label: t("admin.project.form.environment.prod") || "Production" },
											{ value: "test", label: t("admin.project.form.environment.test") || "Test" },
										]}
										placeholder={t("admin.project.form.environmentNamePlaceholder") || "Select environment"}
										required
									/>
								</div>
								<div className="flex-1 min-w-0 sm:min-w-[200px] max-w-full">
									<TextInput
										label={t("admin.project.form.apiUrl") || "API URL"}
										value={envFormData.apiUrl}
										onChange={(value) =>
											setEnvFormData((prev) => ({
												...prev,
												apiUrl: value,
											}))
										}
										placeholder={t("admin.project.form.apiUrlPlaceholder") || "https://api.example.com (optional)"}
									/>
								</div>
								<div className="flex flex-col min-w-0 sm:min-w-[100px] flex-shrink-0 max-w-full">
									<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
										{t("admin.project.form.active") || "Active"}
									</label>
									<div className="flex items-center">
										<ToggleSwitch
											checked={envFormData.isActive}
											onChange={(checked) =>
												setEnvFormData((prev) => ({
													...prev,
													isActive: checked,
												}))
											}
											onLabel={t("admin.project.form.active") || "Active"}
											offLabel={t("admin.project.form.inactive") || "Inactive"}
											className="gap-2"
										/>
									</div>
								</div>
								<div className="flex gap-2 flex-shrink-0 w-full sm:w-auto sm:max-w-none">
									{editingEnvIndex !== null ? (
										<>
											<Button
												type="button"
												variant="outline"
												onClick={handleCancelEditEnv}
												size="sm"
												className="whitespace-nowrap"
											>
												{t("common.button.cancel") || "Cancel"}
											</Button>
											<Button
												type="button"
												variant="primary"
												onClick={handleUpdateEnvironment}
												size="sm"
												className="whitespace-nowrap"
											>
												{t("common.button.update") || "Update"}
											</Button>
										</>
									) : (
										<Button type="button" variant="primary" onClick={handleAddEnvironment} size="sm" className="whitespace-nowrap">
											{t("admin.project.form.add") || "Add"}
										</Button>
									)}
								</div>
							</div>
						</div>

						{/* Environment List */}
						{formData.environments && formData.environments.length > 0 && (
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									{t("admin.project.form.environments") || "Environments"} ({formData.environments.length})
								</label>
								<div className="space-y-2">
									{formData.environments.map((env, index) => (
										<div
											key={index}
											className="flex items-center justify-between rounded border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
										>
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<span className="font-medium text-gray-900 dark:text-white">{env.name}</span>
													{env.isActive ? (
														<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-400">
															{t("admin.project.form.active") || "Active"}
														</span>
													) : (
														<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-900/20 dark:text-gray-400">
															{t("admin.project.form.inactive") || "Inactive"}
														</span>
													)}
												</div>
												{env.apiUrl && (
													<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{env.apiUrl}</p>
												)}
											</div>
											<div className="flex gap-2">
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => handleEditEnvironment(index)}
												>
													{t("common.button.edit") || "Edit"}
												</Button>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => handleRemoveEnvironment(index)}
													className="text-red-600 hover:text-red-700"
												>
													{t("admin.project.form.remove") || "Remove"}
												</Button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Form Actions at Bottom */}
				<div className="sticky bottom-0 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-gray-800/70 dark:bg-gray-900/50 lg:bg-white/95 lg:shadow-lg lg:backdrop-blur supports-backdrop-blur:bg-white/80 dark:lg:bg-gray-900/80">
					<div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:flex-wrap">
					{onCancel && (
						<Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
							{t("common.button.cancel") || "Cancel"}
						</Button>
					)}
					<Button type="button" variant="primary" onClick={handleFormSubmit} disabled={isSubmitting}>
						{isSubmitting ? t("common.message.loading") || "Saving..." : isEditMode ? t("common.button.update") + " " + (t("common.label.projects") || "Project") : t("common.button.create") + " " + (t("common.label.projects") || "Project")}
					</Button>
					</div>
				</div>
			</form>
		</FormLayout>
	);
}


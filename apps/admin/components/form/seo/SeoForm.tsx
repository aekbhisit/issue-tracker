"use client"

import React from "react"
import { useTranslation } from "react-i18next"

import TextInput from "@/components/form/inputs/TextInput"
import TextareaInput from "@/components/form/inputs/TextareaInput"
import FileUpload from "@/components/form/upload/FileUpload"

export interface SeoFormData {
	slug?: string
	meta_title?: string
	meta_description?: string
	meta_keyword?: string
	meta_image?: string
}

interface SeoFormProps {
	value: SeoFormData
	onChange: (data: SeoFormData) => void
	errors?: Record<string, string>
	isEditMode?: boolean
	onSlugGenerate?: (name: string) => string
	seoInputs?: Record<string, { status?: boolean; validate?: boolean; label?: string; recommend?: string; size?: string }>
}

export default function SeoForm({
	value,
	onChange,
	errors = {},
	isEditMode = false,
	onSlugGenerate,
	seoInputs,
}: SeoFormProps) {
	const { t } = useTranslation()

	const handleFieldChange = (field: keyof SeoFormData, fieldValue: string) => {
		onChange({
			...value,
			[field]: fieldValue,
		})
	}

	const handleSlugGenerate = (name: string) => {
		if (onSlugGenerate) {
			const generatedSlug = onSlugGenerate(name)
			handleFieldChange("slug", generatedSlug)
		}
	}

	// Filter fields based on status: only show fields with status === true
	const getFieldConfig = (fieldKey: string) => {
		return seoInputs?.[fieldKey]
	}

	const shouldShowField = (fieldKey: string) => {
		const config = getFieldConfig(fieldKey)
		return config?.status === true
	}

	const getFieldLabel = (fieldKey: string, defaultLabel: string) => {
		const config = getFieldConfig(fieldKey)
		if (config?.label) {
			return t(config.label)
		}
		return t(`common.seo.${fieldKey}`, { defaultValue: defaultLabel })
	}

	const getFieldHelper = (fieldKey: string, defaultHelper?: string) => {
		const config = getFieldConfig(fieldKey)
		if (config?.recommend) {
			return t(config.recommend, {
				defaultValue: (config.recommend.split(".").pop() || config.recommend)
					.replace(/_/g, " ")
					.replace(/\b\w/g, (char: string) => char.toUpperCase()),
			})
		}
		if (defaultHelper) {
			return t(`common.seo.${fieldKey}Helper`, { defaultValue: defaultHelper })
		}
		return undefined
	}

	const isFieldRequired = (fieldKey: string) => {
		const config = getFieldConfig(fieldKey)
		return config?.validate === true
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-medium text-gray-900 dark:text-white">
					{t("admin.content_category.tabs.seo", { defaultValue: "SEO Settings" })}
				</h3>
			</div>

			<div className="space-y-4">
				{shouldShowField("slug") && (
					<TextInput
						id="seo-slug"
						name="seo-slug"
						label={getFieldLabel("slug", "Slug")}
						value={value.slug || ""}
						onChange={(val) => handleFieldChange("slug", val)}
						placeholder={t("common.seo.slugPlaceholder", { defaultValue: "example-slug" })}
						helperText={getFieldHelper("slug", "URL-friendly version of the title. Leave empty to auto-generate from name.")}
						required={isFieldRequired("slug")}
						error={errors.slug}
					/>
				)}

				{shouldShowField("meta_title") && (
					<TextInput
						id="seo-meta-title"
						name="seo-meta-title"
						label={getFieldLabel("meta_title", "Meta Title")}
						value={value.meta_title || ""}
						onChange={(val) => handleFieldChange("meta_title", val)}
						placeholder={t("common.seo.metaTitlePlaceholder", {
							defaultValue: "Enter meta title (recommended: 50-60 characters)",
						})}
						helperText={getFieldHelper("meta_title", "Title shown in search engine results. Recommended length: 50-60 characters.")}
						required={isFieldRequired("meta_title")}
						error={errors.meta_title}
					/>
				)}

				{shouldShowField("meta_description") && (
					<TextareaInput
						label={getFieldLabel("meta_description", "Meta Description")}
						value={value.meta_description || ""}
						onChange={(val) => handleFieldChange("meta_description", val)}
						placeholder={t("common.seo.metaDescriptionPlaceholder", {
							defaultValue: "Enter meta description (recommended: 150-160 characters)",
						})}
						rows={4}
						helperText={getFieldHelper("meta_description", "Description shown in search engine results. Recommended length: 150-160 characters.")}
						required={isFieldRequired("meta_description")}
						error={errors.meta_description}
					/>
				)}

				{shouldShowField("meta_keyword") && (
					<TextInput
						id="seo-meta-keyword"
						name="seo-meta-keyword"
						label={getFieldLabel("meta_keyword", "Meta Keywords")}
						value={value.meta_keyword || ""}
						onChange={(val) => handleFieldChange("meta_keyword", val)}
						placeholder={t("common.seo.metaKeywordPlaceholder", {
							defaultValue: "keyword1, keyword2, keyword3",
						})}
						helperText={getFieldHelper("meta_keyword", "Comma-separated keywords related to this content.")}
						required={isFieldRequired("meta_keyword")}
						error={errors.meta_keyword}
					/>
				)}

				{shouldShowField("meta_image") && (
					<FileUpload
						label={getFieldLabel("meta_image", "Meta Image")}
						uploadType="image"
						value={value.meta_image || ""}
						onChange={(val) => handleFieldChange("meta_image", Array.isArray(val) ? val[0] : (val || ""))}
						helperText={getFieldHelper("meta_image", "Image shown when sharing on social media. Recommended size: 1200x630px.")}
						existingFile={value.meta_image || undefined}
						isEditMode={isEditMode}
						required={isFieldRequired("meta_image")}
						error={errors.meta_image}
					/>
				)}
			</div>
		</div>
	)
}


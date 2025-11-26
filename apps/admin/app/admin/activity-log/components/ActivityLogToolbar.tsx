"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import Button from "@/components/ui/button/Button"

import { SearchField } from "@/components/ui/table"
import ReactSelect, { type SelectOption } from "@/components/form/inputs/ReactSelect"
import { DateLengthPicker } from "@/components/form/inputs"
import { ActivityAction } from "../types"

interface ActivityLogToolbarProps {
	searchQuery: string
	actionFilter: ActivityAction | null
	modelFilter: string | null
	userFilter: number | null
	userOptions: SelectOption[]
	dateFrom: string | null
	dateTo: string | null
	onSearch: (value: string) => void
	onActionFilterChange: (action: ActivityAction | null) => void
	onModelFilterChange: (model: string | null) => void
	onUserFilterChange: (userId: number | null) => void
	onDateFromChange: (date: string | null) => void
	onDateToChange: (date: string | null) => void
	className?: string
}

export function ActivityLogToolbar({
	searchQuery,
	actionFilter,
	modelFilter,
	userFilter,
	userOptions,
	dateFrom,
	dateTo,
	onSearch,
	onActionFilterChange,
	onModelFilterChange,
	onUserFilterChange,
	onDateFromChange,
	onDateToChange,
	className,
}: ActivityLogToolbarProps) {
	const { t } = useTranslation()
	const [showFilters, setShowFilters] = useState(false)

	const actionOptions: SelectOption[] = useMemo(
		() => [
			{ value: "", label: t("admin.activityLog.toolbar.allActions") },
			{ value: ActivityAction.CREATE, label: t("admin.activityLog.actions.create") },
			{ value: ActivityAction.UPDATE, label: t("admin.activityLog.actions.update") },
			{ value: ActivityAction.DELETE, label: t("admin.activityLog.actions.delete") },
		],
		[t]
	)

	const modelOptions: SelectOption[] = useMemo(
		() => [
			{ value: "", label: t("admin.activityLog.toolbar.allModels") },
			{ value: "User", label: t("admin.activityLog.models.user") },
			{ value: "Role", label: t("admin.activityLog.models.role") },
			{ value: "Content", label: t("admin.activityLog.models.content") },
			{ value: "Banner", label: t("admin.activityLog.models.banner") },
			{ value: "Permission", label: t("admin.activityLog.models.permission") },
			{ value: "ContentCategory", label: t("admin.activityLog.models.contentCategory") },
			{ value: "AdminMenu", label: t("admin.activityLog.models.adminMenu") },
			{ value: "Page", label: t("admin.activityLog.models.page") },
		],
		[t]
	)

	const handleActionSelect = (value: string | number | string[] | number[] | null) => {
		if (value === null || value === "") {
			onActionFilterChange(null)
			return
		}
		onActionFilterChange(value as ActivityAction)
	}

	const handleModelSelect = (value: string | number | string[] | number[] | null) => {
		if (value === null || value === "") {
			onModelFilterChange(null)
			return
		}
		onModelFilterChange(value as string)
	}

	const handleUserSelect = (value: string | number | string[] | number[] | null) => {
		if (value === null || value === "") {
			onUserFilterChange(null)
			return
		}
		onUserFilterChange(value as number)
	}

	const handleDateRangeChange = (from: string | null, to: string | null) => {
		onDateFromChange(from)
		onDateToChange(to)
	}

	const allUserOptions: SelectOption[] = useMemo(
		() => [{ value: "", label: t("admin.activityLog.toolbar.allUsers") }, ...userOptions],
		[userOptions, t]
	)

	const containerClass = className ? `space-y-6 ${className}` : "space-y-6"

	return (
		<div className={containerClass}>
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
						{t("admin.activityLog.pageTitle")}
					</h2>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						{t("admin.activityLog.pageDescription")}
					</p>
				</div>
			</div>

			<div className="space-y-4">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
					<SearchField
						value={searchQuery}
						onChange={onSearch}
						placeholder={t("admin.activityLog.toolbar.searchPlaceholder")}
					/>
					<Button variant="outline" onClick={() => setShowFilters((prev) => !prev)}>
						{showFilters ? t("common.table.filters.hide") : t("common.table.filters.show")}
					</Button>
				</div>
				{showFilters && (
					<div className="space-y-4 border-t border-gray-200 pt-4 dark:border-gray-700">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									{t("admin.activityLog.toolbar.user")}
								</label>
								<ReactSelect
									value={userFilter || ""}
									options={allUserOptions}
									onChange={handleUserSelect}
									isClearable
									isSearchable
									placeholder={t("admin.activityLog.toolbar.allUsers")}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									{t("admin.activityLog.toolbar.model")}
								</label>
								<ReactSelect
									value={modelFilter || ""}
									options={modelOptions}
									onChange={handleModelSelect}
									isClearable
									placeholder={t("admin.activityLog.toolbar.allModels")}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									{t("admin.activityLog.toolbar.action")}
								</label>
								<ReactSelect
									value={actionFilter || ""}
									options={actionOptions}
									onChange={handleActionSelect}
									isClearable
									placeholder={t("admin.activityLog.toolbar.allActions")}
								/>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<DateLengthPicker
								id="activity-log-date-range"
								value={{ from: dateFrom, to: dateTo }}
								onChange={handleDateRangeChange}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}


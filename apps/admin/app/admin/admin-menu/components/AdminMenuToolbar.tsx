"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"

import { SearchField } from "@/components/ui/table"
import Button from "@/components/ui/button/Button"
import ReactSelect, { type SelectOption } from "@/components/form/inputs/ReactSelect"
import { PlusIcon } from "@/public/icons"

const TreeIcon = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
		<rect x="10" y="3" width="4" height="4" rx="1" strokeWidth={1.6} />
		<rect x="4" y="15" width="4" height="4" rx="1" strokeWidth={1.6} />
		<rect x="16" y="15" width="4" height="4" rx="1" strokeWidth={1.6} />
		<path d="M12 7v5M12 12l-4 4M12 12l4 4" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
	</svg>
)

interface AdminMenuToolbarProps {
	searchQuery: string
	statusFilter: boolean | null
	parentFilter: number | null
	parentOptions: SelectOption[]
	selectedCount: number
	onSearch: (value: string) => void
	onStatusFilterChange: (status: boolean | null) => void
	onParentFilterChange: (value: number | null) => void
	onTreeSort?: () => void
	onAdd?: () => void
	onBulkDelete?: () => void
	onBulkActivate?: () => void
	onBulkDeactivate?: () => void
	className?: string
}

export function AdminMenuToolbar({
	searchQuery,
	statusFilter,
	parentFilter,
	parentOptions,
	selectedCount,
	onSearch,
	onStatusFilterChange,
	onParentFilterChange,
	onTreeSort,
	onAdd,
	onBulkDelete,
	onBulkActivate,
	onBulkDeactivate,
	className,
}: AdminMenuToolbarProps) {
	const { t } = useTranslation()
	const [showFilters, setShowFilters] = useState(false)

	const statusOptions: SelectOption[] = [
		{ value: "true", label: t("common.table.status.active") },
		{ value: "false", label: t("common.table.status.inactive") },
	]

	const handleStatusSelect = (value: string | number | string[] | number[] | null) => {
		if (value === null || value === "") {
			onStatusFilterChange(null)
			return
		}
		onStatusFilterChange(value === "true")
	}

	const activeFilters: Array<{ key: string; label: string; onClear: () => void }> = []
	if (statusFilter !== null) {
		activeFilters.push({
			key: "status",
			label: `${t("common.label.status")}: ${statusFilter
					? t("common.table.status.active")
					: t("common.table.status.inactive")
				}`,
			onClear: () => onStatusFilterChange(null),
		})
	}
	if (parentFilter !== null) {
		const optionLabel =
			parentOptions.find((option) => {
				if (typeof option.value === "number") return option.value === parentFilter
				const parsed = Number(option.value)
				return !Number.isNaN(parsed) && parsed === parentFilter
			})?.label ?? parentFilter.toString()

		activeFilters.push({
			key: "parent",
			label: `${t("admin.admin_menu.filters.parent")}: ${optionLabel}`,
			onClear: () => onParentFilterChange(null),
		})
	}

	const containerClass = className ? `space-y-6 ${className}` : "space-y-6"

	return (
		<div className={containerClass}>
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						{t("admin.admin_menu.pageTitle")}
					</h1>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						{t("admin.admin_menu.pageDescription")}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					{selectedCount > 0 && (
						<div className="flex items-center gap-2">
							{onBulkActivate && (
								<Button
									variant="outline"
									onClick={onBulkActivate}
									className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300"
								>
									{t("common.table.actions.activate")}
								</Button>
							)}
							{onBulkDeactivate && (
								<Button
									variant="outline"
									onClick={onBulkDeactivate}
									className="border-yellow-200 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 dark:border-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-300"
								>
									{t("common.table.actions.deactivate")}
								</Button>
							)}
							{onBulkDelete && (
								<Button
									variant="outline"
									onClick={onBulkDelete}
									className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
								>
									{t("common.table.actions.deleteSelected")}
								</Button>
							)}
						</div>
					)}
					<div className="flex items-center gap-2">
						{onTreeSort && (
							<Button
								variant="outline"
								onClick={onTreeSort}
								className="flex items-center space-x-2"
							>
								<TreeIcon className="h-4 w-4" />
								<span>{t("common.table.treeSort")}</span>
							</Button>
						)}
						{onAdd && (
							<Button onClick={onAdd} className="flex items-center space-x-2">
								<PlusIcon className="w-6 h-6" />
								<span>{t("common.button.create")}</span>
							</Button>
						)}
					</div>
				</div>
			</div>

			<div className="space-y-4">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<SearchField
						value={searchQuery}
						onChange={onSearch}
						placeholder={t("common.search")}
					/>
					<Button
						variant="outline"
						onClick={() => setShowFilters((prev) => !prev)}
						className="flex items-center space-x-2"
					>
						<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
						</svg>
						<span>{showFilters ? t("common.table.filters.hide") : t("common.table.filters.show")}</span>
					</Button>
				</div>

				{showFilters && (
					<div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 md:grid-cols-2">
						<div>
							<label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("admin.admin_menu.filters.parent")}
							</label>
							<ReactSelect
								options={parentOptions}
								value={parentFilter ?? undefined}
								onChange={(value) => {
									if (value === null || value === "") {
										onParentFilterChange(null)
										return
									}
									const parsed = Number(value)
									onParentFilterChange(Number.isNaN(parsed) ? null : parsed)
								}}
								isClearable
								placeholder={t("admin.admin_menu.filters.parentPlaceholder")}
							/>
						</div>
						<div>
							<label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("common.label.status")}
							</label>
							<ReactSelect
								options={statusOptions}
								value={statusFilter === null ? undefined : statusFilter ? "true" : "false"}
								onChange={handleStatusSelect}
								isClearable
								placeholder={t("common.table.status.all")}
							/>
						</div>
					</div>
				)}

				{activeFilters.length > 0 && (
					<div className="flex items-center space-x-2 pt-2">
						<span className="text-sm text-gray-500 dark:text-gray-400">
							{t("common.table.filters.active")}
						</span>
						<div className="flex flex-wrap items-center gap-2">
							{activeFilters.map((filter) => (
								<span
									key={filter.key}
									className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-800 dark:bg-brand-900/20 dark:text-brand-400"
								>
									{filter.label}
									<button
										type="button"
										onClick={filter.onClear}
										className="ml-2 text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
									>
										×
									</button>
								</span>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}


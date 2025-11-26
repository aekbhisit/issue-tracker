"use client"

import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"

import Button from "@/components/ui/button/Button"
import { SearchField } from "@/components/ui/table"
import ReactSelect, { type SelectOption } from "@/components/form/inputs/ReactSelect"
import { RefreshCwIcon } from "@/public/icons"

interface PermissionToolbarProps {
	searchQuery: string
	selectedCount: number
	scopeFilter: string | null
	moduleFilter: string | null
	groupFilter: string | null
	modules: string[]
	groups: string[]
	onSearch: (value: string) => void
	onScopeFilterChange: (scope: string | null) => void
	onModuleFilterChange: (module: string | null) => void
	onGroupFilterChange: (group: string | null) => void
	onGenerate?: () => void
	className?: string
}

export function PermissionToolbar({
	searchQuery,
	selectedCount,
	scopeFilter,
	moduleFilter,
	groupFilter,
	modules,
	groups,
	onSearch,
	onScopeFilterChange,
	onModuleFilterChange,
	onGroupFilterChange,
	onGenerate,
	className,
}: PermissionToolbarProps) {
	const { t } = useTranslation()
	const [showFilters, setShowFilters] = useState(false)

	const containerClass = className ? `space-y-6 ${className}` : "space-y-6"

	const scopeOptions: SelectOption[] = useMemo(
		() => [
			{ value: "", label: t("admin.permission.toolbar.allScopes") },
			{ value: "admin", label: "Admin" },
			{ value: "member", label: "Member" },
			{ value: "public", label: "Public" },
		],
		[t]
	)

	const moduleOptions: SelectOption[] = useMemo(
		() => [
			{ value: "", label: t("admin.permission.toolbar.allModules") },
			...modules.map((module) => ({ value: module, label: module })),
		],
		[modules, t]
	)

	const groupOptions: SelectOption[] = useMemo(
		() => [
			{ value: "", label: t("admin.permission.toolbar.allGroups") },
			...groups.map((group) => ({ value: group, label: group })),
		],
		[groups, t]
	)

	const handleScopeSelect = (value: string | number | string[] | number[] | null) => {
		if (value === null || value === "") {
			onScopeFilterChange(null)
			return
		}
		onScopeFilterChange(String(value))
	}

	const handleModuleSelect = (value: string | number | string[] | number[] | null) => {
		if (value === null || value === "") {
			onModuleFilterChange(null)
			return
		}
		onModuleFilterChange(String(value))
	}

	const handleGroupSelect = (value: string | number | string[] | number[] | null) => {
		if (value === null || value === "") {
			onGroupFilterChange(null)
			return
		}
		onGroupFilterChange(String(value))
	}

	return (
		<div className={containerClass}>
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
						{t("admin.permission.pageTitle")}
					</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
						{t("admin.permission.pageDescription")}
					</p>
				</div>
				<div className="flex items-center gap-2 flex-wrap">
					{onGenerate && (
						<Button onClick={onGenerate} className="flex items-center gap-2">
							<RefreshCwIcon className="w-6 h-6" />
							<span>{t("admin.permission.toolbar.generate")}</span>
						</Button>
					)}
				</div>
			</div>
			<div className="space-y-4">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
					<div className="flex-1">
						<SearchField value={searchQuery} onChange={onSearch} placeholder={t("common.search")} />
					</div>
					<Button variant="outline" onClick={() => setShowFilters((prev) => !prev)}>
						{showFilters ? t("common.table.filters.hide") : t("common.table.filters.show")}
					</Button>
				</div>
				{showFilters && (
					<div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 md:grid-cols-3">
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("admin.permission.toolbar.scopeFilter")}
							</label>
							<ReactSelect
								options={scopeOptions}
								value={scopeFilter === null ? "" : scopeFilter}
								onChange={handleScopeSelect}
								isClearable
								placeholder={t("admin.permission.toolbar.allScopes")}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("admin.permission.toolbar.moduleFilter")}
							</label>
							<ReactSelect
								options={moduleOptions}
								value={moduleFilter === null ? "" : moduleFilter}
								onChange={handleModuleSelect}
								isClearable
								placeholder={t("admin.permission.toolbar.allModules")}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("admin.permission.toolbar.groupFilter")}
							</label>
							<ReactSelect
								options={groupOptions}
								value={groupFilter === null ? "" : groupFilter}
								onChange={handleGroupSelect}
								isClearable
								placeholder={t("admin.permission.toolbar.allGroups")}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}


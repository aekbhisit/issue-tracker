"use client"

import { useTranslation } from "react-i18next"

import Button from "@/components/ui/button/Button"
import { SearchField } from "@/components/ui/table"
import { checkPermission } from "@/lib/utils/permission.util"

interface RoleToolbarProps {
	scope: string
	searchQuery: string
	selectedCount: number
	onSearch: (value: string) => void
	onAdd?: () => void
	onBulkDelete?: () => void
	onBulkActivate?: () => void
	onBulkDeactivate?: () => void
	className?: string
}

export function RoleToolbar({
	scope,
	searchQuery,
	selectedCount,
	onSearch,
	onAdd,
	onBulkDelete,
	onBulkActivate,
	onBulkDeactivate,
	className,
}: RoleToolbarProps) {
	const { t } = useTranslation()

	const containerClass = className ? `space-y-6 ${className}` : "space-y-6"

	return (
		<div className={containerClass}>
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
						{t("admin.role.pageTitle")}
					</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
						{t("admin.role.pageDescription")}
					</p>
				</div>
				<div className="flex items-center gap-2 flex-wrap">
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
					{onAdd && checkPermission("role", "add_data", scope) && (
						<Button onClick={onAdd} className="flex items-center gap-2">
							<span>+</span>
							<span>{t("common.button.create")}</span>
						</Button>
					)}
				</div>
			</div>
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
				<div className="flex-1">
					<div className="relative">
						<SearchField value={searchQuery} onChange={onSearch} placeholder={t("common.search")} />
					</div>
				</div>
			</div>
		</div>
	)
}



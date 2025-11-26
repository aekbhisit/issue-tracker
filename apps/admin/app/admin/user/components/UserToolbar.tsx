"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import { SearchField } from "@/components/ui/table";
import ReactSelect, { type SelectOption } from "@/components/form/inputs/ReactSelect";
import { checkPermission } from "@/lib/utils/permission.util";

import type { UserRoleOption } from "../types";

interface UserToolbarProps {
	allowDelete?: boolean;
	searchQuery: string;
	statusFilter: boolean | null;
	roleFilter: number | null;
	selectedCount: number;
	roles: UserRoleOption[];
	onSearch: (value: string) => void;
	onStatusFilterChange: (status: boolean | null) => void;
	onRoleFilterChange: (roleId: number | null) => void;
	onAdd: () => void;
	onBulkActivate?: () => void;
	onBulkDeactivate?: () => void;
	onBulkDelete?: () => void;
	className?: string;
}

export function UserToolbar({
	allowDelete = true,
	searchQuery,
	statusFilter,
	roleFilter,
	selectedCount,
	roles,
	onSearch,
	onStatusFilterChange,
	onRoleFilterChange,
	onAdd,
	onBulkActivate,
	onBulkDeactivate,
	onBulkDelete,
	className,
}: UserToolbarProps) {
	const { t } = useTranslation();
	const [showFilters, setShowFilters] = useState(false);

	const statusOptions: SelectOption[] = [
		{ value: "true", label: t("common.table.status.active") },
		{ value: "false", label: t("common.table.status.inactive") },
	];

	const roleOptions = useMemo<SelectOption[]>(
		() => [
			{ value: "", label: t("admin.user.toolbar.roleAll") },
			...roles.map((role) => ({ value: role.id, label: role.name })),
		],
		[roles, t]
	);

	const handleStatusSelect = (value: string | number | string[] | number[] | null) => {
		if (value === null || value === "") {
			onStatusFilterChange(null);
			return;
		}
		onStatusFilterChange(value === "true");
	};

	const handleRoleSelect = (value: string | number | string[] | number[] | null) => {
		if (value === null || value === "") {
			onRoleFilterChange(null);
			return;
		}
		const numericValue = typeof value === "number" ? value : parseInt(String(value), 10);
		onRoleFilterChange(Number.isFinite(numericValue) ? numericValue : null);
	};

	const containerClass = className ? `space-y-6 ${className}` : "space-y-6";

	return (
		<div className={containerClass}>
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
						{t("admin.user.pageTitle")}
					</h2>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						{t("admin.user.pageDescription")}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
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
							{allowDelete && onBulkDelete && (
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
					{checkPermission("user", "add_data", "admin") && (
						<Button onClick={onAdd} className="flex items-center gap-2">
							<span>+</span>
							<span>{t("admin.user.toolbar.addUser")}</span>
						</Button>
					)}
				</div>
			</div>

			<div className="space-y-4">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
					<SearchField
						value={searchQuery}
						onChange={onSearch}
						placeholder={t("admin.user.toolbar.searchPlaceholder")}
					/>
					<Button variant="outline" onClick={() => setShowFilters((prev) => !prev)}>
						{showFilters ? t("common.table.filters.hide") : t("common.table.filters.show")}
					</Button>
				</div>

				{showFilters && (
					<div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 md:grid-cols-2 lg:grid-cols-3">
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("admin.user.toolbar.roleFilter")}
							</label>
							<ReactSelect
								options={roleOptions}
								value={roleFilter === null ? "" : roleFilter}
								onChange={handleRoleSelect}
								isClearable
								placeholder={t("admin.user.toolbar.roleAll")}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}



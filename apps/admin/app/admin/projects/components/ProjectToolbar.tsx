"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import { SearchField } from "@/components/ui/table";
import ReactSelect, { type SelectOption } from "@/components/form/inputs/ReactSelect";
import { checkPermission } from "@/lib/utils/permission.util";

interface ProjectToolbarProps {
	searchQuery: string;
	statusFilter: boolean | null;
	selectedCount: number;
	onSearch: (value: string) => void;
	onStatusFilterChange: (status: boolean | null) => void;
	onAdd: () => void;
	className?: string;
}

export function ProjectToolbar({
	searchQuery,
	statusFilter,
	selectedCount,
	onSearch,
	onStatusFilterChange,
	onAdd,
	className,
}: ProjectToolbarProps) {
	const { t } = useTranslation();
	const [showFilters, setShowFilters] = useState(false);
	const [canAdd, setCanAdd] = useState(false);

	// Check permission on client side only to avoid hydration mismatch
	useEffect(() => {
		if (typeof window !== 'undefined') {
			setCanAdd(checkPermission("project", "add_data", "admin"));
		}
	}, []);

	const statusOptions: SelectOption[] = [
		{ value: "true", label: t("common.table.status.active") || "Active" },
		{ value: "false", label: t("common.table.status.inactive") || "Inactive" },
	];

	const handleStatusSelect = (value: string | number | string[] | number[] | null) => {
		if (value === null || value === "") {
			onStatusFilterChange(null);
			return;
		}
		onStatusFilterChange(value === "true");
	};

	const containerClass = className ? `space-y-6 ${className}` : "space-y-6";

	return (
		<div className={containerClass}>
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("common.label.projects") || "Projects"}</h2>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						{t("admin.project.toolbar.subtitle") || "Manage projects and their environments"}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{canAdd && (
						<Button onClick={onAdd} className="flex items-center gap-2" variant="primary">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
							<span>{t("admin.project.toolbar.addProject") || "Create Project"}</span>
						</Button>
					)}
				</div>
			</div>

			<div className="space-y-4">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
					<SearchField
						value={searchQuery}
						onChange={onSearch}
						placeholder={t("admin.project.toolbar.searchPlaceholder") || "Search projects by name, description, or key..."}
					/>
					<Button variant="outline" onClick={() => setShowFilters((prev) => !prev)}>
						{showFilters ? (t("common.table.filters.hide") || "Hide Filters") : (t("common.table.filters.show") || "Show Filters")}
					</Button>
				</div>

				{showFilters && (
					<div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 md:grid-cols-2 lg:grid-cols-3">
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("common.label.status") || "Status"}
							</label>
							<ReactSelect
								options={statusOptions}
								value={statusFilter === null ? undefined : statusFilter ? "true" : "false"}
								onChange={handleStatusSelect}
								isClearable
								placeholder={t("common.table.status.all") || "All"}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}


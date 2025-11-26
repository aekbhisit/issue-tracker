"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import { SearchField } from "@/components/ui/table";
import ReactSelect, { type SelectOption } from "@/components/form/inputs/ReactSelect";
import { DateLengthPicker, type DateRangeValue } from "@/components/form/inputs";
import { projectApiService } from "@/lib/api/projects";
import { UserApiService } from "@/app/admin/user/api";
import type { IssueStatus, IssueSeverity } from "../types";

interface IssueToolbarProps {
	searchQuery: string;
	statusFilter: IssueStatus | null;
	severityFilter: IssueSeverity | null;
	projectFilter: number | null;
	dateRange: DateRangeValue;
	onSearch: (value: string) => void;
	onStatusFilterChange: (status: IssueStatus | null) => void;
	onSeverityFilterChange: (severity: IssueSeverity | null) => void;
	onProjectFilterChange: (projectId: number | null) => void;
	onDateRangeChange: (from: string | null, to: string | null) => void;
	className?: string;
}

export function IssueToolbar({
	searchQuery,
	statusFilter,
	severityFilter,
	projectFilter,
	dateRange,
	onSearch,
	onStatusFilterChange,
	onSeverityFilterChange,
	onProjectFilterChange,
	onDateRangeChange,
	className,
}: IssueToolbarProps) {
	const { t } = useTranslation();
	const [showFilters, setShowFilters] = useState(false);
	const [projectOptions, setProjectOptions] = useState<SelectOption[]>([]);
	const [loadingProjects, setLoadingProjects] = useState(false);
	const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
	const [loadingUsers, setLoadingUsers] = useState(false);

	const statusOptions: SelectOption[] = [
		{ value: "open", label: t("admin.dashboard.status.open") || "Open" },
		{ value: "in-progress", label: t("admin.dashboard.status.inProgress") || "In Progress" },
		{ value: "resolved", label: t("admin.dashboard.status.resolved") || "Resolved" },
		{ value: "closed", label: t("admin.dashboard.status.closed") || "Closed" },
	];

	const severityOptions: SelectOption[] = [
		{ value: "low", label: t("admin.dashboard.severity.low") || "Low" },
		{ value: "medium", label: t("admin.dashboard.severity.medium") || "Medium" },
		{ value: "high", label: t("admin.dashboard.severity.high") || "High" },
		{ value: "critical", label: t("admin.dashboard.severity.critical") || "Critical" },
	];

	// Load projects for filter dropdown
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoadingProjects(true);
				const allProjects: any[] = [];
				let currentPage = 1;
				let hasMore = true;
				const limit = 100;

				while (hasMore && mounted) {
					const response = await projectApiService.getProjects({
						page: currentPage,
						limit,
						status: true, // Only active projects
					});

					if (!mounted) return;

					allProjects.push(...response.data.data);

					if (currentPage >= response.data.pagination.totalPages) {
						hasMore = false;
					} else {
						currentPage++;
					}
				}

				if (!mounted) return;

				const options: SelectOption[] = [
					{ value: -1, label: t("common.table.status.all") || "All Projects" },
					...allProjects.map((project) => ({
						value: parseInt(project.id),
						label: project.name,
					}))];
				setProjectOptions(options);
			} catch (error) {
				console.error("Failed to load projects", error);
			} finally {
				if (mounted) {
					setLoadingProjects(false);
				}
			}
		})();

		return () => {
			mounted = false;
		};
	}, [t]);

	// Load users for assignee filter
	useEffect(() => {
		if (!showFilters) return; // Only load when filters are shown

		let mounted = true;
		(async () => {
			try {
				setLoadingUsers(true);
				const allUsers: any[] = [];
				let currentPage = 1;
				let hasMore = true;
				const limit = 100;

				while (hasMore && mounted) {
					const response = await UserApiService.getUsers({
						page: currentPage,
						limit,
					});

					if (!mounted) return;

					allUsers.push(...response.data.data);

					if (currentPage >= response.data.pagination.totalPages) {
						hasMore = false;
					} else {
						currentPage++;
					}
				}

				if (!mounted) return;

				const options: SelectOption[] = [
					{ value: -1, label: t("common.label.unassigned") || "Unassigned" },
					...allUsers.map((user) => ({
						value: parseInt(user.id),
						label: user.name || user.username || user.email || `User #${user.id}`,
					}))];
				setUserOptions(options);
			} catch (error) {
				console.error("Failed to load users", error);
			} finally {
				if (mounted) {
					setLoadingUsers(false);
				}
			}
		})();

		return () => {
			mounted = false;
		};
	}, [showFilters, t]);

	const handleStatusSelect = (value: string | number | string[] | number[] | null) => {
		if (value === null || value === "") {
			onStatusFilterChange(null);
			return;
		}
		const statusValue = String(value) as IssueStatus;
		onStatusFilterChange(statusValue);
	};

	const handleSeveritySelect = (value: string | number | string[] | number[] | null) => {
		if (value === null || value === "") {
			onSeverityFilterChange(null);
			return;
		}
		const severityValue = String(value) as IssueSeverity;
		onSeverityFilterChange(severityValue);
	};

	const handleProjectSelect = (value: string | number | string[] | number[] | null) => {
		if (value === null || value === "" || value === -1) {
			onProjectFilterChange(null);
			return;
		}
		onProjectFilterChange(typeof value === 'number' ? value : parseInt(String(value), 10));
	};

	const handleDateRangeChange = useCallback((from: string | null, to: string | null) => {
		onDateRangeChange(from, to);
	}, [onDateRangeChange]);

	const containerClass = className ? `space-y-6 ${className}` : "space-y-6";

	return (
		<div className={containerClass}>
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("common.label.issues") || "Issues"}</h2>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						{t("admin.issue.toolbar.subtitle") || "View and manage reported issues"}
					</p>
				</div>
			</div>

			<div className="space-y-4">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
					<SearchField
						value={searchQuery}
						onChange={onSearch}
						placeholder={t("admin.issue.toolbar.searchPlaceholder") || "Search issues by title or description..."}
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
								value={statusFilter || undefined}
								onChange={handleStatusSelect}
								isClearable
								placeholder={t("common.table.status.all") || "All"}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("common.label.severity") || "Severity"}
							</label>
							<ReactSelect
								options={severityOptions}
								value={severityFilter || undefined}
								onChange={handleSeveritySelect}
								isClearable
								placeholder={t("common.table.status.all") || "All"}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("common.label.project") || "Project"}
							</label>
							<ReactSelect
								options={projectOptions}
								value={projectFilter ?? -1}
								onChange={handleProjectSelect}
								isClearable
								isLoading={loadingProjects}
								placeholder={t("admin.issue.toolbar.allProjects") || "All Projects"}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("common.label.dateRange") || "Date Range"}
							</label>
							<DateLengthPicker
								id="issue-date-range"
								value={dateRange}
								onChange={handleDateRangeChange}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

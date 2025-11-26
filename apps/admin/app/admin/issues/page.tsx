"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { TablePageLayout } from "@/components/tables/TablePageLayout";
import ToastContainer from "@/components/ui/notification/ToastContainer";
import { useNotification } from "@/hooks/useNotification";
import { checkPageAccess } from "@/lib/utils/permission.util";

import { useIssues } from "./hooks/useIssues";
import { IssueTable } from "./components/IssueTable";
import { IssueToolbar } from "./components/IssueToolbar";
import type { Issue, IssueStatus, IssueSeverity } from "./types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

function IssuesPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { t } = useTranslation();
	const notification = useNotification();
	const { toasts, removeToast } = notification;

	// Get initial filters from URL params
	const initialPage = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : DEFAULT_PAGE;
	const initialProjectId = searchParams.get("projectId") ? parseInt(searchParams.get("projectId")!, 10) : undefined;

	const [hasPermission, setHasPermission] = useState<boolean | null>(null);
	const [currentPage, setCurrentPage] = useState(initialPage);
	const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_LIMIT);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<IssueStatus | null>(null);
	const [severityFilter, setSeverityFilter] = useState<IssueSeverity | null>(null);
	const [projectFilter, setProjectFilter] = useState<number | null>(initialProjectId || null);
	const [assigneeFilter, setAssigneeFilter] = useState<number | null>(null);
	const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
	const [sortField, setSortField] = useState<"createdAt" | "updatedAt" | "severity" | "status">("createdAt");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	// Check page permission
	useEffect(() => {
		checkPageAccess(
			{ module: "issue", action: "get_data", type: "admin" },
			(denied) => {
				if (denied) {
					notification.showError({
						message: t("common.errors.noPermission") || "You do not have permission to access this page",
					});
					router.push("/admin/dashboard");
				}
			}
		).then(setHasPermission);
	}, [router, notification, t]);

	// Build query params for React Query
	const queryParams = useMemo(
		() => ({
			page: currentPage,
			limit: itemsPerPage,
			projectId: projectFilter || undefined,
			status: statusFilter || undefined,
			severity: severityFilter || undefined,
			assigneeId: assigneeFilter !== null ? assigneeFilter : undefined,
			startDate: dateRange.from || undefined,
			endDate: dateRange.to || undefined,
			search: searchQuery || undefined,
			sortBy: sortField,
			sortOrder,
		}),
		[currentPage, itemsPerPage, projectFilter, statusFilter, severityFilter, assigneeFilter, dateRange, searchQuery, sortField, sortOrder]
	);

	// Fetch issues using React Query
	const { data, isLoading, error, refetch } = useIssues(queryParams);

	const issues = data?.data || [];
	const pagination = data?.pagination || {
		page: currentPage,
		limit: itemsPerPage,
		total: 0,
		totalPages: 1,
	};

	// Reset to page 1 when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, statusFilter, severityFilter, projectFilter, assigneeFilter, dateRange]);

	// Update URL when filters change
	useEffect(() => {
		const params = new URLSearchParams();
		if (currentPage > 1) params.set("page", currentPage.toString());
		if (projectFilter) params.set("projectId", projectFilter.toString());
		const newUrl = params.toString() ? `/admin/issues?${params.toString()}` : "/admin/issues";
		router.replace(newUrl, { scroll: false });
	}, [currentPage, projectFilter, router]);

	const handleEdit = useCallback(
		(issue: Issue) => {
			router.push(`/admin/issues/${issue.id}`);
		},
		[router]
	);

	const handleStatusChange = useCallback((issue: Issue) => {
		// Status changes are handled in detail page
		router.push(`/admin/issues/${issue.id}`);
	}, [router]);

	const handleAssign = useCallback((issue: Issue) => {
		// Assignment is handled in detail page
		router.push(`/admin/issues/${issue.id}`);
	}, [router]);

	const handleSearch = useCallback((value: string) => {
		setSearchQuery(value);
	}, []);

	const handleStatusFilterChange = useCallback((status: IssueStatus | null) => {
		setStatusFilter(status);
	}, []);

	const handleSeverityFilterChange = useCallback((severity: IssueSeverity | null) => {
		setSeverityFilter(severity);
	}, []);

	const handleProjectFilterChange = useCallback((projectId: number | null) => {
		setProjectFilter(projectId);
	}, []);

	const handleAssigneeFilterChange = useCallback((assigneeId: number | null) => {
		setAssigneeFilter(assigneeId);
	}, []);

	const handleDateRangeChange = useCallback((from: string | null, to: string | null) => {
		setDateRange({ from, to });
	}, []);

	const handleSort = useCallback((field: string, order: "asc" | "desc") => {
		setSortField(field as "createdAt" | "updatedAt" | "severity" | "status");
		setSortOrder(order);
	}, []);

	const handlePageChange = useCallback((page: number) => {
		setCurrentPage(page);
	}, []);

	const handleItemsPerPageChange = useCallback((size: number) => {
		setItemsPerPage(size);
		setCurrentPage(1);
	}, []);

	if (hasPermission === false) {
		return null;
	}

	return (
		<TablePageLayout>
			<IssueToolbar
				searchQuery={searchQuery}
				statusFilter={statusFilter}
				severityFilter={severityFilter}
				projectFilter={projectFilter}
				dateRange={dateRange}
				onSearch={handleSearch}
				onStatusFilterChange={handleStatusFilterChange}
				onSeverityFilterChange={handleSeverityFilterChange}
				onProjectFilterChange={handleProjectFilterChange}
				onDateRangeChange={handleDateRangeChange}
			/>

			<IssueTable
				data={issues}
				loading={isLoading}
				onEdit={handleEdit}
				onStatusChange={handleStatusChange}
				onAssign={handleAssign}
				totalItems={pagination.total}
				totalPages={pagination.totalPages}
				currentPage={pagination.page}
				itemsPerPage={pagination.limit}
				sortField={sortField}
				sortOrder={sortOrder}
				onSort={handleSort}
				onPageChange={handlePageChange}
				onItemsPerPageChange={handleItemsPerPageChange}
			/>

		<ToastContainer toasts={toasts} onRemoveToast={removeToast} />
	</TablePageLayout>
);
}

export default function IssuesPage() {
	return (
		<Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
			<IssuesPageContent />
		</Suspense>
	);
}

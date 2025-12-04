"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { TablePageLayout } from "@/components/tables/TablePageLayout";
import ToastContainer from "@/components/ui/notification/ToastContainer";
import ConfirmModal from "@/components/ui/notification/ConfirmModal";

import { useLoading } from "@/context/LoadingContext";
import { useNotification } from "@/hooks/useNotification";
import { useNavigationOverlay } from "@/hooks/useNavigationOverlay";
import { logger } from "@workspace/utils";
import { checkPageAccess } from "@/lib/utils/permission.util";

import { mapProjectFromApi, projectApiService } from "@/lib/api/projects";
import type { Project } from "./types";
import { ProjectTable, ProjectToolbar } from "./components";

export default function ProjectsPage() {
	const router = useRouter();
	const { t } = useTranslation();
	const notification = useNotification();
	const {
		toasts,
		confirmState,
		showError,
		showSuccess,
		showConfirm,
		removeToast,
		handleConfirm,
		handleCancel,
	} = notification;
	const { showLoading, hideLoading } = useLoading();
	const { pushWithOverlay } = useNavigationOverlay();

	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(false);

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<boolean | null>(null);

	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [totalItems, setTotalItems] = useState(0);
	const [totalPages, setTotalPages] = useState(1);

	const [sortField, setSortField] = useState("updatedAt");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	const hasLoadedInitialRef = useRef(false);
	const [hasPermission, setHasPermission] = useState<boolean | null>(null);

	// Check page permission
	useEffect(() => {
		checkPageAccess(
			{ module: "project", action: "get_data", type: "admin" },
			(denied) => {
				if (denied) {
					showError({
						message: t("common.errors.noPermission") || "You do not have permission to access this page",
					});
					// NOTE: With basePath='/admin', Next.js router.push automatically prepends basePath
					router.push("/dashboard");
				}
			}
		).then(setHasPermission);
	}, [router, showError, t]);

	const loadProjects = useCallback(
		async ({ showGlobal = false }: { showGlobal?: boolean } = {}) => {
			setLoading(true);
			if (showGlobal) {
				showLoading(t("common.message.loading") || "Loading...");
			}

			try {
				const response = await projectApiService.getProjects({
					page: currentPage,
					limit: itemsPerPage,
					search: searchQuery || undefined,
					status: statusFilter,
					sortBy: sortField,
					sortOrder,
				});

				const payload = response.data;
				const mappedProjects = payload.data.map(mapProjectFromApi);
				setProjects(mappedProjects);
				setTotalItems(payload.pagination.total);
				setTotalPages(payload.pagination.totalPages);
			} catch (error) {
				logger.error("Failed to load projects", error);
				showError({
					message: (error as Error).message || "Failed to load projects",
				});
				setProjects([]);
				setTotalItems(0);
				setTotalPages(1);
			} finally {
				if (showGlobal) {
					hideLoading();
				}
				hasLoadedInitialRef.current = true;
				setLoading(false);
			}
		},
		[currentPage, itemsPerPage, searchQuery, statusFilter, sortField, sortOrder, showLoading, hideLoading, showError, t]
	);

	useEffect(() => {
		loadProjects({ showGlobal: !hasLoadedInitialRef.current });
	}, [loadProjects]);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, statusFilter]);

	const handleSearch = (value: string) => {
		setSearchQuery(value);
	};

	const handleStatusFilterChange = (status: boolean | null) => {
		setStatusFilter(status);
	};

	const handleAdd = () => {
		pushWithOverlay("/projects/form");
	};

	const handleEdit = (project: Project) => {
		pushWithOverlay(`/projects/${project.id}`);
	};

	const handleToggleStatus = async (project: Project) => {
		try {
			showLoading(t("common.message.loading") || "Loading...");
			await projectApiService.updateProject(parseInt(project.id, 10), {
				status: !project.status,
			});
			showSuccess({ message: "Project status updated successfully" });
			await loadProjects();
		} catch (error) {
			logger.error("Failed to update project status", error);
			showError({
				message: (error as Error).message || "Failed to update project status",
			});
		} finally {
			hideLoading();
		}
	};

	const handleDelete = (project: Project) => {
		showConfirm({
			title: "Delete Project",
			message: `Are you sure you want to delete project "${project.name}"? This action cannot be undone.`,
			confirmText: t("common.button.delete") || "Delete",
			cancelText: t("common.button.cancel") || "Cancel",
			onConfirm: async () => {
				try {
					showLoading(t("common.message.loading") || "Loading...");
					await projectApiService.deleteProject(parseInt(project.id, 10));
					showSuccess({ message: "Project deleted successfully" });
					await loadProjects();
				} catch (error) {
					logger.error("Failed to delete project", error);
					showError({
						message: (error as Error).message || "Failed to delete project",
					});
				} finally {
					hideLoading();
				}
			},
		});
	};

	const handleSort = (field: string, order: "asc" | "desc") => {
		setSortField(field);
		setSortOrder(order);
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleItemsPerPageChange = (size: number) => {
		setItemsPerPage(size);
		setCurrentPage(1);
	};

	if (hasPermission === false) {
		return null;
	}

	return (
		<TablePageLayout>
			<ProjectToolbar
				searchQuery={searchQuery}
				statusFilter={statusFilter}
				selectedCount={0}
				onSearch={handleSearch}
				onStatusFilterChange={handleStatusFilterChange}
				onAdd={handleAdd}
			/>

			<ProjectTable
				data={projects}
				loading={loading}
				onEdit={handleEdit}
				onDelete={handleDelete}
				onToggleStatus={handleToggleStatus}
				totalItems={totalItems}
				totalPages={totalPages}
				currentPage={currentPage}
				itemsPerPage={itemsPerPage}
				sortField={sortField}
				sortOrder={sortOrder}
				onSort={handleSort}
				onPageChange={handlePageChange}
				onItemsPerPageChange={handleItemsPerPageChange}
			/>

			<ToastContainer toasts={toasts} onRemoveToast={removeToast} />
			<ConfirmModal
				isOpen={confirmState.isOpen}
				title={confirmState.title}
				message={confirmState.message}
				confirmText={confirmState.confirmText}
				cancelText={confirmState.cancelText}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
			/>
		</TablePageLayout>
	);
}

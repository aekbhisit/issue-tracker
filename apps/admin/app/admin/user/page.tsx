"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { TablePageLayout, TableToolbar } from "@/components/tables/TablePageLayout";
import ToastContainer from "@/components/ui/notification/ToastContainer";
import ConfirmModal from "@/components/ui/notification/ConfirmModal";

import { useLoading } from "@/context/LoadingContext";
import { useNotification } from "@/hooks/useNotification";
import { useNavigationOverlay } from "@/hooks/useNavigationOverlay";
import { logger } from "@workspace/utils";
import { useRouter } from "next/navigation";
import { checkPageAccess } from "@/lib/utils/permission.util";

import { mapUserFromApi, userApiService } from "./api";
import type { User, UserRoleOption } from "./types";
import { UserTable, UserToolbar } from "./components";

function UserPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
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

	const [users, setUsers] = useState<User[]>([]);
	const [roles, setRoles] = useState<UserRoleOption[]>([]);
	const [loading, setLoading] = useState(false);

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
	const [roleFilter, setRoleFilter] = useState<number | null>(null);

	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [totalItems, setTotalItems] = useState(0);
	const [totalPages, setTotalPages] = useState(1);

	const [sortField, setSortField] = useState("updatedAt");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	const hasLoadedInitialRef = useRef(false);
	const [hasPermission, setHasPermission] = useState<boolean | null>(null);

	const scopeParam = searchParams?.get("scope")?.trim().toLowerCase();
	const scope = scopeParam && scopeParam.length > 0 ? scopeParam : "admin";

	const canDeleteUser = useCallback((user: User) => !(scope === "admin" && user.id === "1"), [scope]);

	// Check page permission
	useEffect(() => {
		checkPageAccess(
			{ module: "user", action: "get_data", type: "admin" },
			(denied) => {
				if (denied) {
					showError({
						message: t("common.errors.noPermission") || "You do not have permission to access this page",
					});
					router.push("/dashboard");
				}
			}
		).then(setHasPermission);
	}, [router, showError, t]);

	const loadUsers = useCallback(
		async ({ showGlobal = false }: { showGlobal?: boolean } = {}) => {
			setLoading(true);
			setSelectedIds((prev) => (prev.length > 0 ? [] : prev));
			if (showGlobal) {
				showLoading(t("common.message.loading"));
			}

			try {
				const response = await userApiService.getUsers({
					page: currentPage,
					limit: itemsPerPage,
					search: searchQuery || undefined,
					roleId: roleFilter ?? undefined,
					status: statusFilter,
					sortBy: sortField,
					sortOrder,
				});

				const payload = response.data;
				const mappedUsers = payload.data.map(mapUserFromApi);
				setUsers(mappedUsers);
				setSelectedIds((prev) =>
					prev.filter((id) => {
						const user = mappedUsers.find((item) => item.id === id);
						return user ? canDeleteUser(user) : false;
					}),
				);
				setTotalItems(payload.pagination.total);
				setTotalPages(payload.pagination.totalPages);
			} catch (error) {
				logger.error("Failed to load users", error);
				showError({
					message: (error as Error).message || t("admin.user.notifications.loadError"),
				});
				setUsers([]);
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
		[
			currentPage,
			itemsPerPage,
			searchQuery,
			roleFilter,
			statusFilter,
			sortField,
			sortOrder,
			showLoading,
			hideLoading,
			showError,
			canDeleteUser,
			t,
		],
	);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const roleOptions = await userApiService.getRolesList();
				if (!mounted) return;
				setRoles(roleOptions);
			} catch (error) {
				logger.error("Failed to load roles", error);
				showError({
					message: (error as Error).message || t("admin.user.notifications.rolesError"),
				});
			}
		})();
		return () => {
			mounted = false;
		};
	}, [showError, t]);

	useEffect(() => {
		loadUsers({ showGlobal: !hasLoadedInitialRef.current });
	}, [loadUsers]);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, statusFilter, roleFilter, scope]);

	const handleSearch = (value: string) => {
		setSearchQuery(value);
	};

	const handleStatusFilterChange = (status: boolean | null) => {
		setStatusFilter(status);
	};

	const handleRoleFilterChange = (roleId: number | null) => {
		setRoleFilter(roleId);
	};

	const handleAdd = () => {
		pushWithOverlay("/user/form");
	};

	const handleEdit = (user: User) => {
		pushWithOverlay(`/admin/user/form?id=${user.id}`);
	};

	const handleToggleStatus = async (user: User) => {
		try {
			showLoading(t("common.message.loading"));
			await userApiService.updateStatus(parseInt(user.id, 10), !user.status);
			showSuccess({ message: t("admin.user.notifications.statusUpdated") });
			await loadUsers();
		} catch (error) {
			logger.error("Failed to update user status", error);
			showError({
				message: (error as Error).message || t("admin.user.notifications.statusError"),
			});
		} finally {
			hideLoading();
		}
	};

	const handleChangeRole = async (user: User, roleId: number | null) => {
		try {
			showLoading(t("common.message.loading"));
			await userApiService.updateRole(parseInt(user.id, 10), roleId ?? "");
			showSuccess({ message: t("admin.user.notifications.roleUpdated") });
			await loadUsers();
		} catch (error) {
			logger.error("Failed to update user role", error);
			showError({
				message: (error as Error).message || t("admin.user.notifications.roleError"),
			});
		} finally {
			hideLoading();
		}
	};

	const handleDelete = (user: User) => {
		if (!canDeleteUser(user)) {
			return;
		}
		showConfirm({
			title: t("admin.user.confirm.deleteTitle"),
			message: t("admin.user.confirm.deleteMessage", { name: user.name || user.email || user.username }),
			confirmText: t("common.button.delete"),
			cancelText: t("common.button.cancel"),
			onConfirm: async () => {
				try {
					showLoading(t("common.message.loading"));
					await userApiService.deleteUser(parseInt(user.id, 10));
					showSuccess({ message: t("admin.user.notifications.deleteSuccess") });
					await loadUsers();
				} catch (error) {
					logger.error("Failed to delete user", error);
					showError({
						message: (error as Error).message || t("admin.user.notifications.deleteError"),
					});
				} finally {
					hideLoading();
				}
			},
		});
	};

	const handleSelect = (userId: string) => {
		const user = users.find((item) => item.id === userId);
		if (!user || !canDeleteUser(user)) {
			return;
		}
		setSelectedIds((prev) =>
			prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
		);
	};

	const handleSelectAll = () => {
		setSelectedIds((prev) => {
			const deletableIds = users.filter(canDeleteUser).map((role) => role.id);
			if (prev.length === deletableIds.length && deletableIds.every((id) => prev.includes(id))) {
				return [];
			}
			return deletableIds;
		});
	};

	const numericSelectedIds = useMemo(
		() => selectedIds.map((id) => parseInt(id, 10)).filter((id) => Number.isFinite(id)),
		[selectedIds],
	);

	const handleBulkStatus = async (status: boolean) => {
		if (numericSelectedIds.length === 0) {
			return;
		}
		try {
			showLoading(t("common.message.loading"));
			await Promise.all(numericSelectedIds.map((id) => userApiService.updateStatus(id, status)));
			showSuccess({ message: t("admin.user.notifications.bulkStatusSuccess") });
			await loadUsers();
		} catch (error) {
			logger.error("Failed to update user statuses", error);
			showError({
				message: (error as Error).message || t("admin.user.notifications.bulkStatusError"),
			});
		} finally {
			hideLoading();
		}
	};

	const handleBulkDelete = () => {
		if (numericSelectedIds.length === 0) {
			return;
		}
		showConfirm({
			title: t("admin.user.confirm.bulkDeleteTitle", { count: numericSelectedIds.length }),
			message: t("admin.user.confirm.bulkDeleteMessage"),
			confirmText: t("common.button.delete"),
			cancelText: t("common.button.cancel"),
			onConfirm: async () => {
				try {
					showLoading(t("common.message.loading"));
					await Promise.all(numericSelectedIds.map((id) => userApiService.deleteUser(id)));
					showSuccess({ message: t("admin.user.notifications.bulkDeleteSuccess") });
					await loadUsers();
				} catch (error) {
					logger.error("Failed to delete users", error);
					showError({
						message: (error as Error).message || t("admin.user.notifications.bulkDeleteError"),
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
		setCurrentPage(1);
	};

	// Prevent rendering if permission check is not complete or denied
	if (hasPermission === null) {
		return null;
	}

	if (!hasPermission) {
		return null;
	}

	return (
		<TablePageLayout>
			<TableToolbar>
		<UserToolbar
			allowDelete={users.some(canDeleteUser)}
					searchQuery={searchQuery}
					statusFilter={statusFilter}
					roleFilter={roleFilter}
					selectedCount={selectedIds.length}
					roles={roles}
					onSearch={handleSearch}
					onStatusFilterChange={handleStatusFilterChange}
					onRoleFilterChange={handleRoleFilterChange}
					onAdd={handleAdd}
					onBulkActivate={() => handleBulkStatus(true)}
					onBulkDeactivate={() => handleBulkStatus(false)}
					onBulkDelete={users.some(canDeleteUser) ? handleBulkDelete : undefined}
				/>
			</TableToolbar>
			<UserTable
				canDelete={canDeleteUser}
				data={users}
				loading={loading}
				selectedIds={selectedIds}
				onSelect={handleSelect}
				onSelectAll={handleSelectAll}
				onEdit={handleEdit}
				onDelete={handleDelete}
				onToggleStatus={handleToggleStatus}
				onChangeRole={handleChangeRole}
				roles={roles}
				totalItems={totalItems}
				totalPages={totalPages}
				currentPage={currentPage}
				itemsPerPage={itemsPerPage}
				sortField={sortField}
				sortOrder={sortOrder}
				onSort={handleSort}
				onPageChange={setCurrentPage}
				onItemsPerPageChange={(size) => {
					setItemsPerPage(size);
					setCurrentPage(1);
				}}
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

export default function UserPage() {
	return (
		<Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
			<UserPageContent />
		</Suspense>
	);
}



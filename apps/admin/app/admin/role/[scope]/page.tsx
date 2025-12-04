"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useTranslation } from "react-i18next"

import { TablePageLayout, TableToolbar } from "@/components/tables/TablePageLayout"
import ToastContainer from "@/components/ui/notification/ToastContainer"
import ConfirmModal from "@/components/ui/notification/ConfirmModal"

import { useLoading } from "@/context/LoadingContext"
import { useNavigationOverlay } from "@/hooks/useNavigationOverlay"
import { useNotification } from "@/hooks/useNotification"
import { logger } from "@workspace/utils"
import { useRouter } from "next/navigation"
import { checkPageAccess } from "@/lib/utils/permission.util"

import { RoleApiService, mapRoleFromApi } from "./api"
import type { Role } from "./types"
import { RoleTable, RoleToolbar } from "./components"

const DEFAULT_SORT_FIELD = "sequence"
const DEFAULT_SORT_ORDER: "asc" | "desc" = "asc"

export default function RolePage() {
	const router = useRouter()
	const { scope } = useParams<{ scope: string }>()
	const resolvedScope = (scope ?? "admin").toLowerCase()
	const { t } = useTranslation()
	const { pushWithOverlay } = useNavigationOverlay()
	const notification = useNotification()
	const {
		toasts,
		confirmState,
		showError,
		showSuccess,
		showConfirm,
		removeToast,
		handleConfirm,
		handleCancel,
	} = notification
	const { showLoading, hideLoading } = useLoading()

	const [roles, setRoles] = useState<Role[]>([])
	const [loading, setLoading] = useState(false)

	const [searchQuery, setSearchQuery] = useState("")
	const [selectedIds, setSelectedIds] = useState<string[]>([])
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(10)
	const [totalItems, setTotalItems] = useState(0)
	const [totalPages, setTotalPages] = useState(1)
	const [sortField, setSortField] = useState(DEFAULT_SORT_FIELD)
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">(DEFAULT_SORT_ORDER)

	const hasLoadedInitialRef = useRef(false)
	const [hasPermission, setHasPermission] = useState<boolean | null>(null)

	const canDeleteRole = useCallback((role: Role) => !(role.scope === "admin" && role.id === "1"), [])

	// Check page permission
	useEffect(() => {
		checkPageAccess(
			{ module: "role", action: "get_data", type: resolvedScope },
			(denied) => {
				if (denied) {
					showError({
						message: t("common.errors.noPermission") || "You do not have permission to access this page",
					})
					router.push("/dashboard")
				}
			}
		).then(setHasPermission)
	}, [router, showError, t, resolvedScope])

	const loadRoles = useCallback(
		async ({ showGlobal = false }: { showGlobal?: boolean } = {}) => {
			setLoading(true)
			setSelectedIds((prev) => (prev.length > 0 ? [] : prev))
			if (showGlobal) {
				showLoading(t("common.message.loading"))
			}

			try {
				const response = await RoleApiService.getRoles({
					page: currentPage,
					limit: itemsPerPage,
					search: searchQuery || undefined,
					sortBy: sortField,
					sortOrder,
					scope: resolvedScope,
				})
				const payload = response.data
				const mappedRoles = payload.data.map(mapRoleFromApi)
				setRoles(mappedRoles)
				setSelectedIds((prev) => prev.filter((id) => {
					const role = mappedRoles.find((item) => item.id === id)
					return role ? canDeleteRole(role) : false
				}))
				setTotalItems(payload.pagination.total)
				setTotalPages(payload.pagination.totalPages)
			} catch (error) {
				logger.error("Failed to load roles", error)
				showError({
					message: (error as Error).message || t("admin.role.notifications.loadError"),
				})
				setRoles([])
				setTotalItems(0)
				setTotalPages(1)
			} finally {
				if (showGlobal) {
					hideLoading()
				}
				hasLoadedInitialRef.current = true
				setLoading(false)
			}
		},
		[currentPage, itemsPerPage, searchQuery, sortField, sortOrder, resolvedScope, showError, showLoading, hideLoading, canDeleteRole, t],
	)

	useEffect(() => {
		loadRoles({ showGlobal: !hasLoadedInitialRef.current })
	}, [loadRoles])

	useEffect(() => {
		setCurrentPage(1)
	}, [searchQuery, resolvedScope, sortField, sortOrder])

	const handleSearch = (value: string) => {
		setSearchQuery(value)
	}

	const handleAdd = () => {
		pushWithOverlay(`/admin/role/${resolvedScope}/form`)
	}

	const handleEdit = (role: Role) => {
		pushWithOverlay(`/admin/role/${resolvedScope}/form?id=${role.id}`)
	}

	const handleToggleStatus = async (role: Role) => {
		try {
			showLoading(t("common.message.loading"))
			await RoleApiService.toggleStatus(Number(role.id))
			showSuccess({ message: t("admin.role.notifications.statusUpdated") })
			await loadRoles()
		} catch (error) {
			logger.error("Failed to update role status", error)
			showError({
				message: (error as Error).message || t("admin.role.notifications.statusError"),
			})
		} finally {
			hideLoading()
		}
	}

	const handleDelete = (role: Role) => {
		if (!canDeleteRole(role)) {
			return
		}
		showConfirm({
			title: t("admin.role.confirm.deleteTitle"),
			message: t("admin.role.confirm.deleteMessage", {
				name: role.name,
			}),
			confirmText: t("common.button.delete"),
			cancelText: t("common.button.cancel"),
			onConfirm: async () => {
				try {
					showLoading(t("common.message.loading"))
					await RoleApiService.deleteRole(Number(role.id))
					showSuccess({ message: t("admin.role.notifications.deleteSuccess") })
					await loadRoles()
				} catch (error) {
					logger.error("Failed to delete role", error)
					showError({
						message: (error as Error).message || t("admin.role.notifications.deleteError"),
					})
				} finally {
					hideLoading()
				}
			},
		})
	}

	const canShowSequenceActions = sortField === "sequence"

	const handleUpdateSequence = async (role: Role, payload: { action: "up" | "down" } | { sequence: number }) => {
		try {
			showLoading(t("common.message.loading"))

			let action: "up" | "down" | number

			if ("sequence" in payload) {
				const parsed = Number(payload.sequence)
				if (!Number.isInteger(parsed) || parsed < 1) {
					showError({
						message: t("admin.role.notifications.sequenceInvalid"),
					})
					return
				}
				action = parsed
			} else {
				action = payload.action
			}

			await RoleApiService.updateSequence(Number(role.id), action)
			showSuccess({
				message: t("admin.role.notifications.sequenceUpdated"),
			})
			await loadRoles()
		} catch (error) {
			logger.error("Failed to update role sequence", error)
			showError({
				message: (error as Error).message || t("admin.role.notifications.sequenceError"),
			})
		} finally {
			hideLoading()
		}
	}

	const handleSelect = (roleId: string) => {
		const role = roles.find((item) => item.id === roleId)
		if (!role || !canDeleteRole(role)) {
			return
		}
		setSelectedIds((prev) =>
			prev.includes(roleId)
				? prev.filter((id) => id !== roleId)
				: [...prev, roleId],
		)
	}

	const handleSelectAll = () => {
		setSelectedIds((prev) => {
			const deletableIds = roles.filter(canDeleteRole).map((role) => role.id)
			if (prev.length === deletableIds.length && deletableIds.every((id) => prev.includes(id))) {
				return []
			}
			return deletableIds
		})
	}

	const handleSort = (field: string, order: "asc" | "desc") => {
		setSortField(field)
		setSortOrder(order)
		setSelectedIds([])
		setCurrentPage(1)
	}

	// Prevent rendering if permission check is not complete or denied
	if (hasPermission === null) {
		return null
	}

	if (!hasPermission) {
		return null
	}

	return (
		<TablePageLayout>
			<TableToolbar>
				<RoleToolbar
					scope={resolvedScope}
					searchQuery={searchQuery}
					selectedCount={selectedIds.length}
					onSearch={handleSearch}
					onAdd={handleAdd}
				/>
			</TableToolbar>
			<RoleTable
				scope={resolvedScope}
				canDelete={canDeleteRole}
				onUpdateSequence={handleUpdateSequence}
				canShowSequenceActions={canShowSequenceActions}
				data={roles}
				loading={loading}
				totalItems={totalItems}
				totalPages={totalPages}
				currentPage={currentPage}
				itemsPerPage={itemsPerPage}
				selectedIds={selectedIds}
				onSelect={handleSelect}
				onSelectAll={handleSelectAll}
				onEdit={handleEdit}
				onDelete={handleDelete}
				onToggleStatus={handleToggleStatus}
				sortField={sortField}
				sortOrder={sortOrder}
				onSort={handleSort}
				onPageChange={setCurrentPage}
				onItemsPerPageChange={(size) => {
					setItemsPerPage(size)
					setCurrentPage(1)
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
	)
}



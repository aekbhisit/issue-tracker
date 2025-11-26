"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useNotification } from "@/hooks/useNotification"
import ToastContainer from "@/components/ui/notification/ToastContainer"
import ConfirmModal from "@/components/ui/notification/ConfirmModal"
import { logger } from "@workspace/utils"

import { TablePageLayout, TableToolbar } from "@/components/tables/TablePageLayout"
import { adminMenuApiService, AdminMenuApiService } from "./api"
import {
	AdminMenu,
	AdminMenuListQuery,
	AdminMenuListResponse,
	AdminMenuApiResponse,
} from "./types"
import { AdminMenuToolbar } from "./components/AdminMenuToolbar"
import { AdminMenuTable } from "./components/AdminMenuTable"
import { useAdminLanguages } from "@/hooks/useAdminConfig"
import { useLoading } from "@/context/LoadingContext"
import { useNavigationOverlay } from "@/hooks/useNavigationOverlay"
import { useRouter } from "next/navigation"
import { checkPageAccess } from "@/lib/utils/permission.util"
import type { SelectOption } from "@/components/form/inputs/ReactSelect"

const DEFAULT_QUERY: Required<Pick<AdminMenuListQuery, "page" | "limit" | "sortBy" | "sortOrder">> = {
	page: 1,
	limit: 10,
	sortBy: "sequence",
	sortOrder: "asc",
}

export default function AdminMenuPage() {
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
	const { t, i18n } = useTranslation()
const { showLoading, hideLoading } = useLoading()
	const { pushWithOverlay } = useNavigationOverlay()

const { languageCodes } = useAdminLanguages()
	const [menus, setMenus] = useState<AdminMenu[]>([])
	const [totalItems, setTotalItems] = useState(0)
	const [totalPages, setTotalPages] = useState(1)
	const [loading, setLoading] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const [statusFilter, setStatusFilter] = useState<boolean | null>(null)
	const [parentFilter, setParentFilter] = useState<number | null>(null)
	const [currentPage, setCurrentPage] = useState(DEFAULT_QUERY.page)
	const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_QUERY.limit)
	const [sortField, setSortField] = useState(DEFAULT_QUERY.sortBy)
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">(DEFAULT_QUERY.sortOrder)
	const [selectedIds, setSelectedIds] = useState<number[]>([])
	const [parentOptions, setParentOptions] = useState<SelectOption[]>([])

	const hasLoadedInitialRef = useRef(false)

	const loadParentOptions = useCallback(async () => {
		try {
			const response = await adminMenuApiService.getTree()
			const flattenNodes = (nodes: AdminMenu[], depth = 0): SelectOption[] => {
				return nodes.flatMap((node) => {
					const translate =
						node.translates?.find((tr) => tr.lang === i18n.language) ?? node.translates?.[0]
					const name = translate?.name || t("common.message.untitled")
					const prefix = depth > 0 ? `${Array(depth).fill("—").join("")} ` : ""
					const option: SelectOption = {
						value: node.id,
						label: `${prefix}${name}`,
					}
					const childOptions = node.children ? flattenNodes(node.children, depth + 1) : []
					return [option, ...childOptions]
				})
			}

		const options: SelectOption[] = flattenNodes(response.menu ?? [])
			setParentOptions(options)
		} catch (error) {
			logger.error("Failed to load parent options", error)
		}
	}, [i18n.language, t])

	const loadMenus = useCallback(
		async ({ showGlobal = false }: { showGlobal?: boolean } = {}) => {
			setLoading(true)
			setSelectedIds((prev) => (prev.length > 0 ? [] : prev))
			if (showGlobal) {
				showLoading(t("common.message.loading"))
			}
			try {
				const query: AdminMenuListQuery = {
					page: currentPage,
					limit: itemsPerPage,
					search: searchQuery || undefined,
					status: statusFilter === null ? undefined : statusFilter,
					parentId: parentFilter ?? undefined,
					sortBy: sortField,
					sortOrder,
				}
				const response: AdminMenuListResponse = await adminMenuApiService.getAll(query)
				setMenus(response.data)
				setTotalItems(response.pagination.total)
				setTotalPages(response.pagination.totalPages)
			} catch (error) {
				logger.error("Failed to load menus", error)
				showError({ message: (error as Error).message || t("admin.admin_menu.errors.load") })
				setMenus([])
				setTotalItems(0)
				setTotalPages(1)
			} finally {
				if (showGlobal) {
					hideLoading()
				}
				setLoading(false)
				hasLoadedInitialRef.current = true
			}
		},
		[
			currentPage,
			itemsPerPage,
			searchQuery,
			statusFilter,
			parentFilter,
			sortField,
			sortOrder,
			t,
			showError,
			showLoading,
			hideLoading,
		],
	)

	useEffect(() => {
		loadMenus({ showGlobal: !hasLoadedInitialRef.current })
	}, [loadMenus])

	useEffect(() => {
		loadParentOptions()
	}, [loadParentOptions])

	const handleAdd = () => {
		pushWithOverlay("/admin/admin-menu/form")
	}

	const handleTreeSort = () => {
		pushWithOverlay("/admin/admin-menu/tree")
	}

	const handleEdit = (menu: AdminMenu) => {
		pushWithOverlay(`/admin/admin-menu/form?id=${menu.id}`)
	}

	const handleDelete = (menu: AdminMenu) => {
		const menuName = menu.translates?.[0]?.name || t("common.message.untitled")
		showConfirm({
			title: t("admin.admin_menu.confirm.deleteTitle"),
			message: t("admin.admin_menu.confirm.deleteMessage", { name: menuName }),
			onConfirm: async () => {
				try {
					showLoading(t("common.message.loading"))
					await adminMenuApiService.delete(menu.id)
					showSuccess({ message: t("admin.admin_menu.success.delete") })
					await loadMenus()
				} catch (error) {
					showError({ message: (error as Error).message || t("admin.admin_menu.errors.delete") })
				} finally {
					hideLoading()
				}
			},
		})
	}

	const handleToggleStatus = async (menu: AdminMenu) => {
		try {
			showLoading(t("common.message.loading"))
			const formData = AdminMenuApiService.mapApiModelToFormData(menu, languageCodes)
			formData.status = !menu.status
			await adminMenuApiService.update(menu.id, formData)
			showSuccess({
				message: menu.status
					? t("admin.admin_menu.success.deactivate")
					: t("admin.admin_menu.success.activate"),
			})
			await loadMenus()
		} catch (error) {
			showError({ message: (error as Error).message || t("admin.admin_menu.errors.update") })
		} finally {
			hideLoading()
		}
	}

	const handleSelect = (menuId: number) => {
		setSelectedIds((prev) => (prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]))
	}

	const handleSelectAll = () => {
		if (selectedIds.length === menus.length) {
			setSelectedIds([])
		} else {
			setSelectedIds(menus.map((menu) => menu.id))
		}
	}

	const handleBulkActivate = () => {
		if (selectedIds.length === 0) return
		showConfirm({
			title: t("admin.admin_menu.confirm.bulkActivateTitle"),
			message: t("admin.admin_menu.confirm.bulkActivateMessage", { count: selectedIds.length }),
			onConfirm: async () => {
				try {
					showLoading(t("common.message.loading"))
					const updatePromises = selectedIds.map(async (id) => {
						const menuResponse = await adminMenuApiService.getById(id)
						const formData = AdminMenuApiService.mapApiModelToFormData(menuResponse.menu, languageCodes)
						formData.status = true
						return adminMenuApiService.update(id, formData)
					})
					await Promise.all(updatePromises)
					showSuccess({ message: t("admin.admin_menu.success.bulkActivate") })
					await loadMenus()
				} catch (error) {
					showError({ message: (error as Error).message || t("admin.admin_menu.errors.bulkActivate") })
				} finally {
					hideLoading()
				}
			},
		})
	}

	const handleBulkDeactivate = () => {
		if (selectedIds.length === 0) return
		showConfirm({
			title: t("admin.admin_menu.confirm.bulkDeactivateTitle"),
			message: t("admin.admin_menu.confirm.bulkDeactivateMessage", { count: selectedIds.length }),
			onConfirm: async () => {
				try {
					showLoading(t("common.message.loading"))
					const updatePromises = selectedIds.map(async (id) => {
						const menuResponse = await adminMenuApiService.getById(id)
						const formData = AdminMenuApiService.mapApiModelToFormData(menuResponse.menu, languageCodes)
						formData.status = false
						return adminMenuApiService.update(id, formData)
					})
					await Promise.all(updatePromises)
					showSuccess({ message: t("admin.admin_menu.success.bulkDeactivate") })
					await loadMenus()
				} catch (error) {
					showError({ message: (error as Error).message || t("admin.admin_menu.errors.bulkDeactivate") })
				} finally {
					hideLoading()
				}
			},
		})
	}

	const handleBulkDelete = () => {
		if (selectedIds.length === 0) return
		showConfirm({
			title: t("admin.admin_menu.confirm.bulkDeleteTitle"),
			message: t("admin.admin_menu.confirm.bulkDeleteMessage", { count: selectedIds.length }),
			onConfirm: async () => {
				try {
					showLoading(t("common.message.loading"))
					await Promise.all(selectedIds.map((id) => adminMenuApiService.delete(id)))
					showSuccess({ message: t("admin.admin_menu.success.bulkDelete") })
					await loadMenus()
				} catch (error) {
					showError({ message: (error as Error).message || t("admin.admin_menu.errors.bulkDelete") })
				} finally {
					hideLoading()
				}
			},
		})
	}

	return (
		<TablePageLayout>
			<TableToolbar>
				<AdminMenuToolbar
					searchQuery={searchQuery}
					statusFilter={statusFilter}
					parentFilter={parentFilter}
					parentOptions={parentOptions}
					selectedCount={selectedIds.length}
					onSearch={(value) => {
						setSearchQuery(value)
						setCurrentPage(1)
					}}
					onStatusFilterChange={(status) => {
						setStatusFilter(status)
						setCurrentPage(1)
					}}
					onParentFilterChange={(value) => {
						setParentFilter(value)
						setCurrentPage(1)
					}}
					onTreeSort={handleTreeSort}
					onAdd={handleAdd}
					onBulkActivate={handleBulkActivate}
					onBulkDeactivate={handleBulkDeactivate}
					onBulkDelete={handleBulkDelete}
				/>
			</TableToolbar>
			<AdminMenuTable
				data={menus}
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
				onSort={(field, order) => {
					setSortField(field)
					setSortOrder(order)
				}}
				onPageChange={(page) => setCurrentPage(page)}
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
				onConfirm={handleConfirm}
				onCancel={handleCancel}
			/>
		</TablePageLayout>
	)
}


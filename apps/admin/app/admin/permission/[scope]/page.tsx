"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useTranslation } from "react-i18next"

import { TablePageLayout, TableToolbar } from "@/components/tables/TablePageLayout"
import ToastContainer from "@/components/ui/notification/ToastContainer"
import ConfirmModal from "@/components/ui/notification/ConfirmModal"

import { useLoading } from "@/context/LoadingContext"
import { useNotification } from "@/hooks/useNotification"
import { logger } from "@workspace/utils"
import { useRouter } from "next/navigation"
import { checkPageAccess } from "@/lib/utils/permission.util"

import { PermissionApiService, mapPermissionFromApi } from "./api"
import type { Permission } from "./types"
import { PermissionTable, PermissionToolbar } from "./components"

const DEFAULT_SORT_FIELD = "module"
const DEFAULT_SORT_ORDER: "asc" | "desc" = "asc"

export default function PermissionPage() {
	const router = useRouter()
	const { scope } = useParams<{ scope: string }>()
	const resolvedScope = (scope ?? "admin").toLowerCase()
	const { t } = useTranslation()
	const notification = useNotification()
	const {
		toasts,
		confirmState,
		showError,
		showSuccess,
		removeToast,
		handleConfirm,
		handleCancel,
	} = notification
	const { showLoading, hideLoading } = useLoading()

	const [permissions, setPermissions] = useState<Permission[]>([])
	const [loading, setLoading] = useState(false)

	const [searchQuery, setSearchQuery] = useState("")
	const [scopeFilter, setScopeFilter] = useState<string | null>(null)
	const [moduleFilter, setModuleFilter] = useState<string | null>(null)
	const [groupFilter, setGroupFilter] = useState<string | null>(null)
	const [modules, setModules] = useState<string[]>([])
	const [groups, setGroups] = useState<string[]>([])
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(10)
	const [totalItems, setTotalItems] = useState(0)
	const [totalPages, setTotalPages] = useState(1)
	const [sortField, setSortField] = useState(DEFAULT_SORT_FIELD)
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">(DEFAULT_SORT_ORDER)

	const hasLoadedInitialRef = useRef(false)
	const [hasPermission, setHasPermission] = useState<boolean | null>(null)

	// Check page permission
	useEffect(() => {
		checkPageAccess(
			{ module: "permission", action: "get_data", type: resolvedScope },
			(denied) => {
				if (denied) {
					showError({
						message: t("common.errors.noPermission") || "You do not have permission to access this page",
					})
					router.push("/admin/dashboard")
				}
			}
		).then(setHasPermission)
	}, [router, showError, t, resolvedScope])

	const loadModulesAndGroups = useCallback(async () => {
		try {
			const [modulesData, groupsData] = await Promise.all([
				PermissionApiService.getModules(),
				PermissionApiService.getGroups(),
			])
			setModules(modulesData)
			setGroups(groupsData)
		} catch (error) {
			logger.error("Failed to load modules and groups", error)
		}
	}, [])

	useEffect(() => {
		loadModulesAndGroups()
	}, [loadModulesAndGroups])

	const loadPermissions = useCallback(
		async ({ showGlobal = false }: { showGlobal?: boolean } = {}) => {
			setLoading(true)
			if (showGlobal) {
				showLoading(t("common.message.loading"))
			}

			try {
				const response = await PermissionApiService.getPermissions({
					page: currentPage,
					limit: itemsPerPage,
					search: searchQuery || undefined,
					sortBy: sortField,
					sortOrder,
					scope: scopeFilter || resolvedScope,
					module: moduleFilter || undefined,
					group: groupFilter || undefined,
				})
				const payload = response.data
				const mappedPermissions = payload.data.map(mapPermissionFromApi)
				setPermissions(mappedPermissions)
				setTotalItems(payload.pagination.total)
				setTotalPages(payload.pagination.totalPages)
			} catch (error) {
				logger.error("Failed to load permissions", error)
				showError({
					message: (error as Error).message || t("admin.permission.notifications.loadError"),
				})
				setPermissions([])
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
		[currentPage, itemsPerPage, searchQuery, sortField, sortOrder, resolvedScope, scopeFilter, moduleFilter, groupFilter, showError, showLoading, hideLoading, t],
	)

	useEffect(() => {
		loadPermissions({ showGlobal: !hasLoadedInitialRef.current })
	}, [loadPermissions])

	useEffect(() => {
		setCurrentPage(1)
	}, [searchQuery, resolvedScope, sortField, sortOrder, scopeFilter, moduleFilter, groupFilter])

	const handleSearch = (value: string) => {
		setSearchQuery(value)
	}

	const handleScopeFilterChange = (scope: string | null) => {
		setScopeFilter(scope)
	}

	const handleModuleFilterChange = (module: string | null) => {
		setModuleFilter(module)
	}

	const handleGroupFilterChange = (group: string | null) => {
		setGroupFilter(group)
	}

	const handleGenerate = async () => {
		try {
			showLoading(t("common.message.loading"))
			await PermissionApiService.generatePermissions()
			showSuccess({
				message: t("admin.permission.notifications.generateSuccess"),
			})
			await loadPermissions({ showGlobal: false })
		} catch (error) {
			logger.error("Failed to generate permissions", error)
			showError({
				message:
					(error as Error).message ||
					t("admin.permission.notifications.generateError"),
			})
		} finally {
			hideLoading()
		}
	}


	const handleSort = (field: string, order: "asc" | "desc") => {
		setSortField(field)
		setSortOrder(order)
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
				<PermissionToolbar
					searchQuery={searchQuery}
					selectedCount={0}
					scopeFilter={scopeFilter}
					moduleFilter={moduleFilter}
					groupFilter={groupFilter}
					modules={modules}
					groups={groups}
					onSearch={handleSearch}
					onScopeFilterChange={handleScopeFilterChange}
					onModuleFilterChange={handleModuleFilterChange}
					onGroupFilterChange={handleGroupFilterChange}
					onGenerate={handleGenerate}
				/>
			</TableToolbar>
			<PermissionTable
				scope={resolvedScope}
				data={permissions}
				loading={loading}
				totalItems={totalItems}
				totalPages={totalPages}
				currentPage={currentPage}
				itemsPerPage={itemsPerPage}
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


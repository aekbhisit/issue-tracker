"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"

import { TablePageLayout, TableToolbar } from "@/components/tables/TablePageLayout"
import ToastContainer from "@/components/ui/notification/ToastContainer"

import { useLoading } from "@/context/LoadingContext"
import { useNotification } from "@/hooks/useNotification"
import { logger } from "@workspace/utils"
import { checkPageAccess } from "@/lib/utils/permission.util"

import { mapActivityLogFromApi, activityLogApiService } from "./api"
import type { ActivityLog, ActivityAction } from "./types"
import { ActivityLogTable, ActivityLogToolbar, ActivityLogDetailModal } from "./components"
import { UserApiService } from "../user/api"
import type { SelectOption } from "@/components/form/inputs/ReactSelect"

export default function ActivityLogPage() {
	const router = useRouter()
	const { t } = useTranslation()
	const notification = useNotification()
	const { toasts, showError, removeToast } = notification
	const { showLoading, hideLoading } = useLoading()

	const [logs, setLogs] = useState<ActivityLog[]>([])
	const [loading, setLoading] = useState(false)

	const [searchQuery, setSearchQuery] = useState("")
	const [actionFilter, setActionFilter] = useState<ActivityAction | null>(null)
	const [modelFilter, setModelFilter] = useState<string | null>(null)
	const [userFilter, setUserFilter] = useState<number | null>(null)
	const [dateFrom, setDateFrom] = useState<string | null>(null)
	const [dateTo, setDateTo] = useState<string | null>(null)
	const [userOptions, setUserOptions] = useState<SelectOption[]>([])

	const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(10)
	const [totalItems, setTotalItems] = useState(0)
	const [totalPages, setTotalPages] = useState(1)

	const [sortField, setSortField] = useState("createdAt")
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

	const hasLoadedInitialRef = useRef(false)
	const [hasPermission, setHasPermission] = useState<boolean | null>(null)

	// Load user list for filter
	useEffect(() => {
		const loadUsers = async () => {
			try {
				const allUsers: any[] = []
				let currentPage = 1
				let hasMore = true
				const limit = 100 // Max limit allowed by API

				// Fetch all users by pagination
				while (hasMore) {
					const response = await UserApiService.getUsers({
						page: currentPage,
						limit,
						// No status filter - get all users
					})
					
					allUsers.push(...response.data.data)
					
					// Check if there are more pages
					if (currentPage >= response.data.pagination.totalPages) {
						hasMore = false
					} else {
						currentPage++
					}
				}

				const options: SelectOption[] = allUsers.map((user) => ({
					value: parseInt(user.id),
					label: user.name || user.username || user.email || `User #${user.id}`,
				}))
				setUserOptions(options)
			} catch (error) {
				logger.error("Failed to load users for filter", error)
			}
		}
		if (hasPermission) {
			loadUsers()
		}
	}, [hasPermission])

	// Check page permission
	useEffect(() => {
		checkPageAccess(
			{ module: "activity_log", action: "get_data", type: "admin" },
			(denied) => {
				if (denied) {
					showError({
						message: t("common.errors.noPermission") || "You do not have permission to access this page",
					})
					router.push("/admin/dashboard")
				}
			}
		).then(setHasPermission)
	}, [router, showError, t])

	const loadLogs = useCallback(
		async ({ showGlobal = false }: { showGlobal?: boolean } = {}) => {
			setLoading(true)
			if (showGlobal) {
				showLoading(t("common.message.loading"))
			}

			try {
				const response = await activityLogApiService.getActivityLogs({
					page: currentPage,
					limit: itemsPerPage,
					search: searchQuery || undefined,
					action: actionFilter || undefined,
					model: modelFilter || undefined,
					userId: userFilter || undefined,
					dateFrom: dateFrom || undefined,
					dateTo: dateTo || undefined,
					sortBy: sortField,
					sortOrder,
				})

				const payload = response.data
				const mappedLogs = payload.data.map(mapActivityLogFromApi)
				setLogs(mappedLogs)
				setTotalItems(payload.pagination.total)
				setTotalPages(payload.pagination.totalPages)
			} catch (error) {
				logger.error("Failed to load activity logs", error)
				showError({
					message: (error as Error).message || t("admin.activityLog.notifications.loadError") || "Failed to load activity logs",
				})
				setLogs([])
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
		[
			currentPage,
			itemsPerPage,
			searchQuery,
			actionFilter,
			modelFilter,
			userFilter,
			dateFrom,
			dateTo,
			sortField,
			sortOrder,
			showLoading,
			hideLoading,
			showError,
			t,
		]
	)

	useEffect(() => {
		loadLogs({ showGlobal: !hasLoadedInitialRef.current })
	}, [loadLogs])

	useEffect(() => {
		setCurrentPage(1)
	}, [searchQuery, actionFilter, modelFilter, userFilter, dateFrom, dateTo])

	const handleSearch = (value: string) => {
		setSearchQuery(value)
	}

	const handleActionFilterChange = (action: ActivityAction | null) => {
		setActionFilter(action)
	}

	const handleModelFilterChange = (model: string | null) => {
		setModelFilter(model)
	}

	const handleUserFilterChange = (userId: number | null) => {
		setUserFilter(userId)
	}

	const handleDateFromChange = (date: string | null) => {
		setDateFrom(date)
	}

	const handleDateToChange = (date: string | null) => {
		setDateTo(date)
	}

	const handleView = (log: ActivityLog) => {
		setSelectedLog(log)
		setIsDetailModalOpen(true)
	}

	const handleCloseModal = () => {
		setIsDetailModalOpen(false)
		setSelectedLog(null)
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
				<ActivityLogToolbar
					searchQuery={searchQuery}
					actionFilter={actionFilter}
					modelFilter={modelFilter}
					userFilter={userFilter}
					userOptions={userOptions}
					dateFrom={dateFrom}
					dateTo={dateTo}
					onSearch={handleSearch}
					onActionFilterChange={handleActionFilterChange}
					onModelFilterChange={handleModelFilterChange}
					onUserFilterChange={handleUserFilterChange}
					onDateFromChange={handleDateFromChange}
					onDateToChange={handleDateToChange}
				/>
			</TableToolbar>
			<ActivityLogTable
				data={logs}
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
				onView={handleView}
			/>
			<ActivityLogDetailModal
				log={selectedLog}
				isOpen={isDetailModalOpen}
				onClose={handleCloseModal}
			/>
			<ToastContainer toasts={toasts} onRemoveToast={removeToast} />
		</TablePageLayout>
	)
}


"use client"

import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ColumnDef } from "@tanstack/react-table"

import Badge from "@/components/ui/badge/Badge"
import { ClientDateFormatter } from "@/components/ui/ClientDateFormatter"
import { ViewAction } from "@/components/ui/table/actions"
import type { ActivityLog } from "../types"
import { ActivityAction } from "../types"

export interface UseActivityLogTableColumnsProps {
	onView: (log: ActivityLog) => void
}

export function useActivityLogTableColumns({
	onView,
}: UseActivityLogTableColumnsProps): ColumnDef<ActivityLog>[] {
	const { t } = useTranslation()

	return useMemo<ColumnDef<ActivityLog>[]>(() => {
		return [
			{
				id: "action",
				accessorKey: "action",
				header: t("admin.activityLog.table.action") || "Action",
				cell: ({ row }) => {
					const action = row.original.action
					const color =
						action === ActivityAction.CREATE
							? "success"
							: action === ActivityAction.UPDATE
							? "warning"
							: "error"
					return (
						<Badge variant="light" color={color} className="font-medium">
							{action}
						</Badge>
					)
				},
			},
			{
				id: "user",
				accessorKey: "user",
				header: t("admin.activityLog.table.user"),
				cell: ({ row }) => {
					const user = row.original.user
					if (!user) {
						return <span className="text-gray-400">System</span>
					}
					return (
						<div className="flex flex-col">
							<span className="font-medium text-gray-900 dark:text-white">
								{user.name || user.username || user.email || "Unknown"}
							</span>
							{user.email && user.name && (
								<span className="text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
							)}
						</div>
					)
				},
			},
			{
				id: "model",
				accessorKey: "model",
				header: t("admin.activityLog.table.model"),
				cell: ({ row }) => {
					return (
						<span className="font-medium text-gray-900 dark:text-white">{row.original.model}</span>
					)
				},
			},
			{
				id: "modelId",
				accessorKey: "modelId",
				header: t("admin.activityLog.table.modelId"),
				cell: ({ row }) => {
					return <span className="text-gray-600 dark:text-gray-400">{row.original.modelId}</span>
				},
			},
			{
				id: "createdAt",
				accessorKey: "createdAt",
				header: t("admin.activityLog.table.timestamp"),
				cell: ({ row }) => {
					const date = row.original.createdAt
					return (
						<div className="flex flex-col">
							<span className="text-sm text-gray-900 dark:text-white">
								<ClientDateFormatter date={date} format="date" />
							</span>
							<span className="text-xs text-gray-500 dark:text-gray-400">
								<ClientDateFormatter date={date} format="time" />
							</span>
						</div>
					)
				},
			},
			{
				id: "actions",
				header: t("common.table.actionsHeader"),
				cell: ({ row }) => {
					return (
						<div className="flex items-center space-x-1">
							<ViewAction
								onClick={() => onView(row.original)}
								title={t("common.button.view")}
							/>
						</div>
					)
				},
				enableSorting: false,
			},
		]
	}, [t, onView])
}


"use client"

import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import Badge from "@/components/ui/badge/Badge"
import { formatDate } from "@workspace/utils"

import { Permission } from "../types"

interface PermissionTableColumnsOptions {}

export const usePermissionTableColumns = ({}: PermissionTableColumnsOptions) => {
	const { t } = useTranslation()

	return useMemo<ColumnDef<Permission>[]>(() => {
		const columns: ColumnDef<Permission>[] = [
			{
				id: "scope",
				accessorKey: "scope",
				header: t("admin.permission.table.scope"),
				cell: ({ row }) => (
					<Badge color="info" size="sm">
						{row.original.scope}
					</Badge>
				),
				enableSorting: true,
			},
			{
				id: "method",
				accessorKey: "method",
				header: t("admin.permission.table.method"),
				cell: ({ row }) => {
					const isDelete = row.original.method === "DELETE"
					if (isDelete) {
						return (
							<span className="inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium text-theme-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
								{row.original.method}
							</span>
						)
					}
					const methodColors: Record<string, "primary" | "success" | "warning" | "error" | "info"> = {
						GET: "info",
						POST: "success",
						PUT: "warning",
						PATCH: "warning",
					}
					const color = methodColors[row.original.method] || "primary"
					return (
						<Badge color={color} size="sm">
							{row.original.method}
						</Badge>
					)
				},
				enableSorting: true,
			},
			{
				id: "module",
				accessorKey: "module",
				header: t("admin.permission.table.module"),
				cell: ({ row }) => (
					<span className="text-sm text-gray-600 dark:text-gray-300">{row.original.module}</span>
				),
				enableSorting: true,
			},
			{
				id: "type",
				accessorKey: "type",
				header: t("admin.permission.table.type"),
				cell: ({ row }) => (
					<span className="text-sm text-gray-600 dark:text-gray-300">
						{row.original.type || "-"}
					</span>
				),
				enableSorting: true,
			},
			{
				id: "group",
				accessorKey: "group",
				header: t("admin.permission.table.group"),
				cell: ({ row }) => (
					<span className="text-sm text-gray-600 dark:text-gray-300">{row.original.group}</span>
				),
				enableSorting: true,
			},
			{
				id: "action",
				accessorKey: "action",
				header: t("admin.permission.table.action"),
				cell: ({ row }) => (
					<span className="text-sm text-gray-600 dark:text-gray-300">{row.original.action}</span>
				),
				enableSorting: true,
			},
			{
				id: "path",
				accessorKey: "path",
				header: t("admin.permission.table.path"),
				cell: ({ row }) => (
					<span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
						{row.original.path}
					</span>
				),
				enableSorting: true,
			},
			{
				id: "metaName",
				accessorKey: "metaName",
				header: t("admin.permission.table.metaName"),
				cell: ({ row }) => (
					<span className="text-sm text-gray-600 dark:text-gray-300">{row.original.metaName}</span>
				),
				enableSorting: true,
			},
			{
				id: "updatedAt",
				accessorKey: "updatedAt",
				header: t("common.label.updatedAt"),
				cell: ({ row }) => (
					<span className="text-sm text-gray-500 dark:text-gray-400">
						{formatDate(row.original.updatedAt)}
					</span>
				),
				enableSorting: true,
			},
		]

		return columns
	}, [t])
}


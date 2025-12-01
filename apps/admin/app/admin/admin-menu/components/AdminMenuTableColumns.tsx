"use client"

import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ColumnDef } from "@tanstack/react-table"

import Badge from "@/components/ui/badge/Badge"
import { EditAction, DeleteAction } from "@/components/ui/table/actions"
import { StatusToggleButton } from "@/components/ui/table/StatusToggleButton"
import { ClientTableDate } from "@/components/ui/ClientDateFormatter"
import { AdminMenu } from "../types"

interface AdminMenuTableColumnsProps {
	onEdit: (menu: AdminMenu) => void
	onDelete: (menu: AdminMenu) => void
	onToggleStatus: (menu: AdminMenu) => void
	onSelect: (menuId: number) => void
	isSelected: (menuId: number) => boolean
}

export function useAdminMenuTableColumns({
	onEdit,
	onDelete,
	onToggleStatus,
	onSelect,
	isSelected,
}: AdminMenuTableColumnsProps): ColumnDef<AdminMenu>[] {
	const { t, i18n } = useTranslation()

	return useMemo<ColumnDef<AdminMenu>[]>(
		() => [
			{
				id: "select",
				header: () => (
					<span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">#</span>
				),
				cell: ({ row }) => (
					<input
						type="checkbox"
						checked={isSelected(row.original.id)}
						onChange={() => onSelect(row.original.id)}
						className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500"
						aria-label={t("common.table.select")}
					/>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: "name",
				header: t("common.label.name"),
				accessorKey: "name",
				enableSorting: true,
				cell: ({ row }) => {
					const menu = row.original
					const currentLang = i18n.language || "th"
					const translate = menu.translates?.find((tr) => tr.lang === currentLang)
					const fallbackTranslate = menu.translates?.[0]
					const name = translate?.name || fallbackTranslate?.name || t("common.message.untitled")
					const level = Math.max(menu.level ?? 0, 0)
					const prefix = level > 0 ? `${Array(level).fill("—").join("")} ` : ""
					return (
						<span className="font-medium text-gray-900 dark:text-white">
							{prefix}
							{name}
						</span>
					)
				},
			},
			{
				id: "path",
				header: t("admin.admin_menu.table.path"),
				accessorKey: "path",
				cell: ({ row }) => {
					const path = row.original.path
					return <span className="text-gray-600 dark:text-gray-400">{path || "-"}</span>
				},
			},
			{
				id: "module",
				header: t("admin.admin_menu.table.module"),
				accessorKey: "module",
				cell: ({ row }) => {
					const module = row.original.module
					return <span className="text-gray-600 dark:text-gray-400">{module || "-"}</span>
				},
			},
			{
				id: "type",
				header: t("common.label.type"),
				accessorKey: "type",
				cell: ({ row }) => {
					const type = row.original.type
					return <span className="text-gray-600 dark:text-gray-400">{type || "-"}</span>
				},
			},
			{
				id: "group",
				header: t("common.label.group"),
				accessorKey: "group",
				cell: ({ row }) => {
					const group = row.original.group
					return group ? (
						<Badge color="info" size="sm">
							{t(`common.group.${group}`)}
						</Badge>
					) : (
						<span className="text-gray-400">-</span>
					)
				},
			},
			{
				id: "sequence",
				header: t("common.label.sequence"),
				accessorKey: "sequence",
				cell: ({ row }) => {
					const menu = row.original
					const currentLang = i18n.language || "th"
					const parentTranslate = menu.parent?.translates?.find((tr) => tr.lang === currentLang)
					const parentFallback = menu.parent?.translates?.find((tr) => tr.lang === "th") ?? menu.parent?.translates?.[0]
					const parentName = parentTranslate?.name || parentFallback?.name
					return (
						<div className="flex flex-col text-sm">
							<span className="text-gray-600 dark:text-gray-400">
								{t("admin.admin_menu.table.parentLabel")}:{" "}
								{parentName || (menu.parentId ? t("common.message.untitled") : "-")}
							</span>
							<span className="font-semibold text-gray-900 dark:text-white">
								{t("common.label.sequence")}: {menu.sequence}
							</span>
						</div>
					)
				},
			},
			{
				id: "status",
				header: t("common.label.status"),
				accessorKey: "status",
				cell: ({ row }) => {
					const menu = row.original
					return (
						<StatusToggleButton
							isActive={menu.status}
							onToggle={() => onToggleStatus(menu)}
							activeLabel={t("common.table.status.active")}
							inactiveLabel={t("common.table.status.inactive")}
						/>
					)
				},
			},
			{
				id: "updatedAt",
				header: t("common.label.updatedAt"),
				accessorKey: "updatedAt",
				cell: ({ row }) => {
					const date = new Date(row.original.updatedAt)
					return <ClientTableDate date={date} />
				},
			},
			{
				id: "action",
				header: t("common.label.action"),
				cell: ({ row }) => {
					const menu = row.original
					return (
						<div className="flex items-center space-x-1">
							<EditAction onClick={() => onEdit(menu)} title={t("common.button.edit")} />
							<DeleteAction onClick={() => onDelete(menu)} title={t("common.button.delete")} />
						</div>
					)
				},
				enableSorting: false,
				enableHiding: false,
			},
		],
		[t, onEdit, onDelete, onToggleStatus, onSelect, isSelected]
	)
}


"use client"

import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { SequenceSorter } from "@/components/ui/table/SequenceSorter"
import { EditAction, DeleteAction } from "@/components/ui/table/actions"
import { StatusToggleButton } from "@/components/ui/table/StatusToggleButton"
import { formatDate } from "@workspace/utils"
import { checkPermission } from "@/lib/utils/permission.util"

import { Role } from "../types"

interface RoleTableColumnsOptions {
	scope: string
	onEdit: (role: Role) => void
	onDelete: (role: Role) => void
	onToggleStatus: (role: Role) => void
	onSelect?: (roleId: string) => void
	isSelected?: (roleId: string) => boolean
	canDelete?: (role: Role) => boolean
	onUpdateSequence?: (role: Role, payload: { action: "up" | "down" } | { sequence: number }) => void
	canShowSequenceActions?: boolean
}

export const useRoleTableColumns = ({
	scope,
	onEdit,
	onDelete,
	onToggleStatus,
	onUpdateSequence,
	canShowSequenceActions = false,
	onSelect,
	isSelected,
	canDelete,
}: RoleTableColumnsOptions) => {
	const { t } = useTranslation()

	return useMemo<ColumnDef<Role>[]>(() => {
		const columns: ColumnDef<Role>[] = [
			{
				id: "select",
				header: () => (
					<span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">#</span>
				),
				cell: ({ row }) => {
					const role = row.original
					const deletable = canDelete ? canDelete(role) : true
					return (
						<input
							type="checkbox"
							className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
							checked={Boolean(isSelected?.(role.id))}
							onChange={() => deletable && onSelect?.(role.id)}
							disabled={!deletable}
							aria-label={t("common.table.select")}
						/>
					)
				},
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: "name",
				accessorKey: "name",
				header: t("admin.role.table.name"),
				cell: ({ row }) => (
					<div className="flex flex-col">
						<span className="text-sm font-medium text-gray-900 dark:text-white">
							{row.original.name}
						</span>
						<span className="text-xs text-gray-500 dark:text-gray-400">
							{t("admin.role.table.scope")}: {row.original.scope}
						</span>
					</div>
				),
				enableSorting: true,
			},
			{
				id: "usersCount",
				accessorKey: "usersCount",
				header: t("admin.role.table.users"),
				cell: ({ row }) => (
					<span className="text-sm text-gray-600 dark:text-gray-300">
						{row.original.usersCount ?? 0}
					</span>
				),
				enableSorting: true,
			},
			{
				id: "sequence",
				accessorKey: "sequence",
				header: t("common.label.sequence"),
				cell: ({ row }) => {
					const role = row.original

					if (!canShowSequenceActions) {
						return <span className="text-sm text-gray-600 dark:text-gray-300">{role.sequence}</span>
					}

					return (
						<SequenceSorter
							value={role.sequence}
							onMove={(direction) => onUpdateSequence?.(role, { action: direction })}
							onCommit={(sequence) => onUpdateSequence?.(role, { sequence })}
							moveUpLabel={t("admin.role.table.moveUp")}
							moveDownLabel={t("admin.role.table.moveDown")}
							inputAriaLabel={t("admin.role.table.sequenceInput")}
							min={0}
						/>
					)
				},
				enableSorting: true,
			},
			{
				id: "status",
				accessorKey: "status",
				header: t("common.label.status"),
				cell: ({ row }) => (
					<StatusToggleButton
						isActive={row.original.status}
						onToggle={() => onToggleStatus(row.original)}
						activeLabel={t("common.table.status.active")}
						inactiveLabel={t("common.table.status.inactive")}
					/>
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
			{
				id: "actions",
				header: t("common.label.action"),
				cell: ({ row }) => {
					const role = row.original
					const deletable = canDelete ? canDelete(role) : true
					const canEdit = checkPermission("role", "edit_data", scope)
					const canDeleteAction = deletable && checkPermission("role", "delete_data", scope)
					
					return (
						<div className="flex items-center space-x-1">
							{canEdit && <EditAction onClick={() => onEdit(role)} />}
							{canDeleteAction && <DeleteAction onClick={() => onDelete(role)} />}
						</div>
					)
				},
				enableSorting: false,
				enableHiding: false,
			},
		]

		return columns
	}, [canDelete, canShowSequenceActions, isSelected, onDelete, onEdit, onSelect, onToggleStatus, onUpdateSequence, scope, t])
}



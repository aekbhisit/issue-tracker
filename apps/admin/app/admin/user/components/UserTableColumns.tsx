"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";

import Badge from "@/components/ui/badge/Badge";
import { ClientTableDate } from "@/components/ui/ClientDateFormatter";
import { EditAction, DeleteAction } from "@/components/ui/table/actions";
import { StatusToggleButton } from "@/components/ui/table/StatusToggleButton";
import { checkPermission } from "@/lib/utils/permission.util";

import type { User, UserRoleOption } from "../types";

export interface UseUserTableColumnsProps {
	allowDelete?: boolean;
	canDelete?: (user: User) => boolean;
	roles: UserRoleOption[];
	onEdit: (user: User) => void;
	onDelete: (user: User) => void;
	onToggleStatus: (user: User) => void;
	onChangeRole: (user: User, roleId: number | null) => void;
	onSelect: (userId: string) => void;
	isSelected: (userId: string) => boolean;
}

export function useUserTableColumns({
	allowDelete = true,
	canDelete,
	roles,
	onEdit,
	onDelete,
	onToggleStatus,
	onChangeRole,
	onSelect,
	isSelected,
}: UseUserTableColumnsProps): ColumnDef<User>[] {
	const { t } = useTranslation();

	return useMemo<ColumnDef<User>[]>(() => {
		return [
			{
				id: "select",
				header: () => (
					<span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">#</span>
				),
				cell: ({ row }) => {
					const user = row.original;
					const isProtected = !(canDelete ? canDelete(user) : true) || !allowDelete;
					return (
						<input
							type="checkbox"
							checked={isSelected(user.id)}
							onChange={() => {
								if (!isProtected) {
									onSelect(user.id);
								}
							}}
							disabled={isProtected}
							className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
							aria-label={t("common.table.select")}
						/>
					);
				},
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: "name",
				accessorKey: "name",
				header: t("common.label.name"),
				cell: ({ row }) => {
					const user = row.original;
					const primary = user.name || user.username || user.email || t("common.message.untitled");
					return (
						<div className="flex flex-col">
							<span className="font-medium text-gray-900 dark:text-white">{primary}</span>
							{user.email && (
								<span className="text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
							)}
						</div>
					);
				},
			},
			{
				id: "username",
				accessorKey: "username",
				header: t("admin.user.table.username"),
				cell: ({ row }) => (
					<span className="text-gray-600 dark:text-gray-400">{row.original.username || "-"}</span>
				),
			},
			{
				id: "role",
				header: t("admin.user.table.role"),
				cell: ({ row }) => {
					const user = row.original;
					const matchedRole = roles.find((role) => role.id === user.roleId);
					const label = matchedRole?.name || t("admin.user.table.roleNone");
					return (
						<Badge color={matchedRole ? "info" : "light"} size="sm">
							{label}
						</Badge>
					);
				},
				enableSorting: false,
			},
			{
				id: "status",
				header: t("common.label.status"),
				accessorKey: "status",
				cell: ({ row }) => {
					const user = row.original;
					return (
						<StatusToggleButton
							isActive={user.status}
							onToggle={() => onToggleStatus(user)}
							activeLabel={t("common.table.status.active")}
							inactiveLabel={t("common.table.status.inactive")}
						/>
					);
				},
			},
			{
				id: "loginAt",
				header: t("admin.user.table.lastLogin"),
				accessorKey: "loginAt",
				cell: ({ row }) => {
					const value = row.original.loginAt;
					if (!value) {
						return <span className="text-gray-400">-</span>;
					}
					return <ClientTableDate date={value} />;
				},
			},
			{
				id: "updatedAt",
				header: t("common.label.updatedAt"),
				accessorKey: "updatedAt",
				cell: ({ row }) => (
					<ClientTableDate date={row.original.updatedAt} />
				),
			},
			{
				id: "actions",
				header: t("common.label.action"),
				cell: ({ row }) => {
					const user = row.original;
					const isProtected = !(canDelete ? canDelete(user) : true) || !allowDelete;
					const canEdit = checkPermission("user", "edit_data", "admin");
					const canDeleteAction = !isProtected && checkPermission("user", "delete_data", "admin");
					
					return (
						<div className="flex items-center gap-2">
							{canEdit && (
								<EditAction onClick={() => onEdit(user)} title={t("common.table.actions.edit")} />
							)}
							{canDeleteAction && (
								<DeleteAction onClick={() => onDelete(user)} title={t("common.table.actions.delete")} />
							)}
						</div>
					);
				},
				enableSorting: false,
			},
		];
	}, [allowDelete, canDelete, isSelected, onChangeRole, onDelete, onEdit, onSelect, onToggleStatus, roles, t]);
}



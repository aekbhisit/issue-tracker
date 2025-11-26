"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { EditAction, DeleteAction, StatusToggleAction } from "@/components/ui/table/actions";
import { checkPermission } from "@/lib/utils/permission.util";

import type { Project } from "../types";

export interface UseProjectTableColumnsProps {
	allowDelete?: boolean;
	onEdit: (project: Project) => void;
	onDelete: (project: Project) => void;
	onToggleStatus: (project: Project) => void;
}

export function useProjectTableColumns({
	allowDelete = true,
	onEdit,
	onDelete,
	onToggleStatus,
}: UseProjectTableColumnsProps): ColumnDef<Project>[] {
	const { t } = useTranslation();

	return useMemo<ColumnDef<Project>[]>(() => {
		return [
			{
				id: "name",
				accessorKey: "name",
				header: t("common.label.name") || "Name",
				cell: ({ row }) => {
					const project = row.original;
					return (
						<Link
							href={`/admin/projects/${project.id}`}
							className="flex flex-col hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer group"
						>
							<span className="font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
								{project.name}
							</span>
							{project.description && (
								<span className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
									{project.description}
								</span>
							)}
						</Link>
					);
				},
			},
			{
				id: "issues",
				header: t("common.label.issues") || "Issues",
				cell: ({ row }) => {
					const project = row.original;
					const pendingCount = project.issueCounts?.pending ?? 0;
					const totalCount = project.issueCounts?.total ?? 0;
					
					return (
						<Link
							href={`/admin/issues?projectId=${project.id}`}
							className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors cursor-pointer group"
						>
							<span className="flex items-center gap-1">
								{pendingCount > 0 ? (
									<span className="font-semibold text-orange-600 dark:text-orange-400">{pendingCount}</span>
								) : (
									<span className="text-gray-500 dark:text-gray-400">0</span>
								)}
								<span className="text-gray-400 dark:text-gray-500">{t("admin.issue.table.pending") || "pending"}</span>
								<span className="text-gray-300 dark:text-gray-600">/</span>
								<span className="text-gray-600 dark:text-gray-300">{totalCount}</span>
								<span className="text-gray-400 dark:text-gray-500">{t("admin.issue.table.total") || "total"}</span>
							</span>
							<svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
							</svg>
						</Link>
					);
				},
				enableSorting: false,
			},
			{
				id: "allowedDomains",
				header: t("admin.project.form.allowedDomains") || "Allowed Domains",
				cell: ({ row }) => {
					const project = row.original;
					const domains = project.allowedDomains || [];
					if (domains.length === 0) {
						return <span className="text-gray-400">-</span>;
					}
					return (
						<div className="flex flex-col">
							<span className="text-gray-900 dark:text-white">{domains.length} {t("admin.project.table.domain") || "domain(s)"}</span>
							{domains.length > 0 && (
								<span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1" title={domains.join(", ")}>
									{domains[0]}
									{domains.length > 1 && ` +${domains.length - 1}`}
								</span>
							)}
						</div>
					);
				},
				enableSorting: false,
			},
			{
				id: "createdAt",
				header: t("common.label.createdAt") || "Created",
				accessorKey: "createdAt",
				cell: ({ row }) => (
					<span className="text-gray-600 dark:text-gray-400">
						{row.original.createdAt.toLocaleDateString()} {row.original.createdAt.toLocaleTimeString()}
					</span>
				),
			},
			{
				id: "actions",
				header: t("common.label.action") || "Actions",
				cell: ({ row }) => {
					const project = row.original;
					const canEdit = checkPermission("project", "edit_data", "admin");
					const canDeleteAction = allowDelete && checkPermission("project", "delete_data", "admin");
					const canToggleStatus = checkPermission("project", "edit_data", "admin");

					return (
						<div className="flex items-center gap-2">
							{canToggleStatus && (
								<StatusToggleAction
									isActive={project.status}
									onClick={() => onToggleStatus(project)}
									title={project.status ? (t("common.table.actions.deactivate") || "Deactivate") : (t("common.table.actions.activate") || "Activate")}
								/>
							)}
							{canEdit && (
								<EditAction onClick={() => onEdit(project)} title={t("common.table.actions.edit") || "Edit"} />
							)}
							{canDeleteAction && (
								<DeleteAction onClick={() => onDelete(project)} title={t("common.table.actions.delete") || "Delete"} />
							)}
						</div>
					);
				},
				enableSorting: false,
			},
		];
	}, [allowDelete, onDelete, onEdit, onToggleStatus, t]);
}


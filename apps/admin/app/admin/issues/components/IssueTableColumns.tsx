"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import EditAction from "@/components/ui/table/actions/EditAction";
import { checkPermission } from "@/lib/utils/permission.util";
import Badge from "@/components/ui/badge/Badge";
import { ClientTableDate } from "@/components/ui/ClientDateFormatter";

import type { Issue } from "../types";

export interface UseIssueTableColumnsProps {
	onEdit: (issue: Issue) => void;
	onStatusChange?: (issue: Issue) => void;
	onAssign?: (issue: Issue) => void;
}

export function useIssueTableColumns({
	onEdit,
	onStatusChange,
	onAssign,
}: UseIssueTableColumnsProps): ColumnDef<Issue>[] {
	const { t } = useTranslation();

	return useMemo<ColumnDef<Issue>[]>(() => {
		return [
			{
				id: "id",
				accessorKey: "id",
				header: t("admin.issue.table.id") || "ID",
				cell: ({ row }) => (
					<span className="font-mono text-sm text-gray-600 dark:text-gray-400">
						#{row.original.id}
					</span>
				),
			},
			{
				id: "title",
				accessorKey: "title",
				header: t("common.label.title"),
				cell: ({ row }) => {
					const issue = row.original;
					return (
						<div className="flex flex-col">
							<Link
								href={`/issues/${issue.id}`}
								className="font-medium text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
							>
								{issue.title}
							</Link>
							{issue.description && (
								<span className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
									{issue.description}
								</span>
							)}
						</div>
					);
				},
			},
			{
				id: "project",
				header: t("common.label.project"),
				cell: ({ row }) => {
					const issue = row.original;
					if (!issue.project) {
						return <span className="text-gray-400">-</span>;
					}
					return (
						<Link
							href={`/projects/${issue.project.id}`}
							className="text-sm font-medium text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
						>
							{issue.project.name}
						</Link>
					);
				},
				enableSorting: false,
			},
			{
				id: "severity",
				accessorKey: "severity",
				header: t("common.label.severity"),
				cell: ({ row }) => {
					const severity = row.original.severity;
					const severityColors: Record<string, "success" | "warning" | "error" | "info"> = {
						low: "info",
						medium: "warning",
						high: "error",
						critical: "error",
					};
					const severityLabels: Record<string, string> = {
						low: "Low",
						medium: "Medium",
						high: "High",
						critical: "Critical",
					};
					const color = severityColors[severity] || "info";
					return (
						<Badge color={color} size="sm">
							{severityLabels[severity] || severity}
						</Badge>
					);
				},
			},
			{
				id: "status",
				accessorKey: "status",
				header: t("common.label.status"),
				cell: ({ row }) => {
					const status = row.original.status;
					const statusColors: Record<string, "success" | "warning" | "error" | "info"> = {
						open: "error",
						"in-progress": "warning",
						resolved: "success",
						closed: "info",
					};
					const statusLabels: Record<string, string> = {
						open: t("admin.issue.status.open"),
						"in-progress": t("admin.issue.status.inProgress"),
						resolved: t("admin.issue.status.resolved"),
						closed: t("admin.issue.status.closed"),
					};
					const color = statusColors[status] || "info";
					return (
						<Badge color={color} size="sm">
							{statusLabels[status] || status}
						</Badge>
					);
				},
			},
			{
				id: "assignee",
				header: t("admin.issue.table.assignee"),
				cell: ({ row }) => {
					const issue = row.original;
					if (!issue.assignee) {
						return <span className="text-gray-400">{t("admin.issue.table.unassigned")}</span>;
					}
					return (
						<div className="flex flex-col">
							<span className="text-sm text-gray-900 dark:text-white">
								{issue.assignee.name || issue.assignee.email || `User #${issue.assignee.id}`}
							</span>
							{issue.assignee.email && issue.assignee.name && (
								<span className="text-xs text-gray-500 dark:text-gray-400">
									{issue.assignee.email}
								</span>
							)}
						</div>
					);
				},
				enableSorting: false,
			},
			{
				id: "createdAt",
				header: t("common.label.createdAt"),
				accessorKey: "createdAt",
				cell: ({ row }) => (
					<ClientTableDate date={row.original.createdAt} />
				),
			},
			{
				id: "actions",
				header: t("common.label.action"),
				cell: ({ row }) => {
					const issue = row.original;
					const canEdit = checkPermission("issue", "edit_data", "admin");
					const canView = checkPermission("issue", "get_detail", "admin");

					return (
						<div className="flex items-center gap-2">
							{canView && (
								<EditAction
									onClick={() => onEdit(issue)}
									title={t("common.table.actions.view")}
								/>
							)}
						</div>
					);
				},
				enableSorting: false,
			},
		];
	}, [onEdit, onStatusChange, onAssign, t]);
}


"use client";

import {
	ColumnFiltersState,
	PaginationState,
	SortingState,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import { DTLoading } from "@/components/ui/loading";
import ReactSelect, { type SelectOption } from "@/components/form/inputs/ReactSelect";

import type { Issue } from "../types";
import { useIssueTableColumns } from "./IssueTableColumns";

interface IssueTableProps {
	data: Issue[];
	loading: boolean;
	onEdit: (issue: Issue) => void;
	onStatusChange?: (issue: Issue) => void;
	onAssign?: (issue: Issue) => void;
	totalItems: number;
	totalPages: number;
	currentPage: number;
	itemsPerPage: number;
	sortField: string;
	sortOrder: "asc" | "desc";
	onSort: (field: string, order: "asc" | "desc") => void;
	onPageChange: (page: number) => void;
	onItemsPerPageChange: (size: number) => void;
}

export function IssueTable({
	data,
	loading,
	onEdit,
	onStatusChange,
	onAssign,
	totalItems,
	totalPages,
	currentPage,
	itemsPerPage,
	sortField,
	sortOrder,
	onSort,
	onPageChange,
	onItemsPerPageChange,
}: IssueTableProps) {
	const { t } = useTranslation();
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const sortingState = useMemo<SortingState>(
		() => (sortField ? [{ id: sortField, desc: sortOrder === "desc" }] : []),
		[sortField, sortOrder]
	);

	const paginationState = useMemo<PaginationState>(
		() => ({ pageIndex: Math.max(currentPage - 1, 0), pageSize: itemsPerPage }),
		[currentPage, itemsPerPage]
	);

	const columns = useIssueTableColumns({
		onEdit,
		onStatusChange,
		onAssign,
	});

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting: sortingState,
			pagination: paginationState,
			columnFilters,
		},
		enableSortingRemoval: false,
		manualSorting: true,
		manualPagination: true,
		pageCount: totalPages,
		onSortingChange: (updater) => {
			const newSorting = typeof updater === "function" ? updater(sortingState) : updater;
			if (newSorting.length > 0) {
				const nextSort = newSorting[0];
				onSort(nextSort.id, nextSort.desc ? "desc" : "asc");
			} else {
				onSort(sortField, sortOrder);
			}
		},
		onPaginationChange: (updater) => {
			const newPagination = typeof updater === "function" ? updater(paginationState) : paginationState;
			if (newPagination.pageIndex !== paginationState.pageIndex) {
				onPageChange(newPagination.pageIndex + 1);
			}
			if (newPagination.pageSize !== paginationState.pageSize) {
				onItemsPerPageChange(newPagination.pageSize);
			}
		},
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		autoResetPageIndex: false,
	});

	const perPageOptions = useMemo<SelectOption[]>(
		() =>
			[10, 20, 50].map((size) => ({
				value: size,
				label: t("common.table.perPage", { count: size }) || `${size} per page`,
			})),
		[t]
	);

	if (loading) {
		return <DTLoading />;
	}

	return (
		<div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
			<div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<h3 className="text-lg font-medium text-gray-900 dark:text-white">Issues</h3>
						<span className="text-sm text-gray-500 dark:text-gray-400">
							{t("common.table.totalItems", { count: totalItems }) || `Total: ${totalItems}`}
						</span>
					</div>
				</div>
			</div>
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
					<thead className="bg-gray-50 dark:bg-gray-700">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										onClick={header.column.getToggleSortingHandler()}
										className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${
											header.column.getCanSort()
												? "cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
												: ""
										}`}
									>
										<div className="flex items-center gap-2">
											{flexRender(header.column.columnDef.header, header.getContext())}
											{header.column.getCanSort() && (
												<span>
													{{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as string] ?? "↕"}
												</span>
											)}
										</div>
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
						{table.getRowModel().rows.length === 0 ? (
							<tr>
								<td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
									{t("common.table.noData") || "No issues found"}
								</td>
							</tr>
						) : (
							table.getRowModel().rows.map((row) => (
								<tr
									key={row.id}
									className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
								>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="whitespace-nowrap px-6 py-4 text-sm">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			{totalPages > 1 && (
				<div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
					<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-700 dark:text-gray-300">
								{t("common.table.showing") || "Showing"} {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} -{" "}
								{Math.min(currentPage * itemsPerPage, totalItems)} {t("common.table.of") || "of"} {totalItems}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => onPageChange(currentPage - 1)}
								disabled={currentPage === 1}
							>
								{t("common.table.previous") || "Previous"}
							</Button>
							<span className="text-sm text-gray-700 dark:text-gray-300">
								{t("common.table.page") || "Page"} {currentPage} {t("common.table.of") || "of"} {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => onPageChange(currentPage + 1)}
								disabled={currentPage >= totalPages}
							>
								{t("common.table.next") || "Next"}
							</Button>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-700 dark:text-gray-300">
								{t("common.table.itemsPerPage") || "Items per page"}:
							</span>
							<ReactSelect
								options={perPageOptions}
								value={itemsPerPage}
								onChange={(value) => {
									if (typeof value === "number") {
										onItemsPerPageChange(value);
									}
								}}
								className="w-24"
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}


"use client"

import {
	ColumnFiltersState,
	PaginationState,
	SortingState,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import Button from "@/components/ui/button/Button"
import { DTLoading } from "@/components/ui/loading"
import ReactSelect, { type SelectOption } from "@/components/form/inputs/ReactSelect"

import type { ActivityLog } from "../types"
import { useActivityLogTableColumns } from "./ActivityLogTableColumns"

interface ActivityLogTableProps {
	data: ActivityLog[]
	loading: boolean
	totalItems: number
	totalPages: number
	currentPage: number
	itemsPerPage: number
	sortField: string
	sortOrder: "asc" | "desc"
	onSort: (field: string, order: "asc" | "desc") => void
	onPageChange: (page: number) => void
	onItemsPerPageChange: (size: number) => void
	onView: (log: ActivityLog) => void
}

export function ActivityLogTable({
	data,
	loading,
	totalItems,
	totalPages,
	currentPage,
	itemsPerPage,
	sortField,
	sortOrder,
	onSort,
	onPageChange,
	onItemsPerPageChange,
	onView,
}: ActivityLogTableProps) {
	const { t } = useTranslation()
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

	const sortingState = useMemo<SortingState>(
		() => (sortField ? [{ id: sortField, desc: sortOrder === "desc" }] : []),
		[sortField, sortOrder]
	)

	const paginationState = useMemo<PaginationState>(
		() => ({ pageIndex: Math.max(currentPage - 1, 0), pageSize: itemsPerPage }),
		[currentPage, itemsPerPage]
	)

	const columns = useActivityLogTableColumns({ onView })

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting: sortingState,
			pagination: paginationState,
			columnFilters,
		},
		enableSortingRemoval: false,
		manualPagination: true,
		manualSorting: true,
		pageCount: totalPages,
		onSortingChange: (updater) => {
			const newSorting = typeof updater === "function" ? updater(sortingState) : updater
			if (newSorting.length > 0) {
				const nextSort = newSorting[0]
				onSort(nextSort.id, nextSort.desc ? "desc" : "asc")
			} else {
				onSort(sortField, sortOrder)
			}
		},
		onPaginationChange: (updater) => {
			const newPagination = typeof updater === "function" ? updater(paginationState) : updater
			if (newPagination.pageIndex !== paginationState.pageIndex) {
				onPageChange(newPagination.pageIndex + 1)
			}
			if (newPagination.pageSize !== paginationState.pageSize) {
				onItemsPerPageChange(newPagination.pageSize)
			}
		},
		onColumnFiltersChange: setColumnFilters,
		autoResetPageIndex: false,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	})

	const perPageOptions = useMemo<SelectOption[]>(
		() =>
			[10, 20, 50].map((size) => ({
				value: size,
				label: t("common.table.perPage", { count: size }),
			})),
		[t]
	)

	return (
		<div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-gray-50 dark:bg-gray-900">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
									>
										{header.isPlaceholder ? null : (
											<div
												className={
													header.column.getCanSort()
														? "cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300"
														: ""
												}
												onClick={header.column.getToggleSortingHandler()}
											>
												{flexRender(header.column.columnDef.header, header.getContext())}
												{{
													asc: " ↑",
													desc: " ↓",
												}[header.column.getIsSorted() as string] ?? null}
											</div>
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
						{loading ? (
							<tr>
								<td colSpan={columns.length} className="px-6 py-12 text-center">
									<DTLoading />
								</td>
							</tr>
						) : data.length === 0 ? (
							<tr>
								<td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
									{t("common.table.noData") || "No data available"}
								</td>
							</tr>
						) : (
							table.getRowModel().rows.map((row) => (
								<tr
									key={row.id}
									className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
								>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="whitespace-nowrap px-6 py-4">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			<div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 md:flex-row md:items-center md:justify-between">
				<span className="text-sm text-gray-600 dark:text-gray-300">
					{t("common.table.paginationSummary", {
						from: totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1,
						to: Math.min(currentPage * itemsPerPage, totalItems),
						total: totalItems,
					})}
				</span>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
						disabled={currentPage <= 1}
					>
						{t("common.button.previous")}
					</Button>
					<span className="text-sm text-gray-600 dark:text-gray-300">
						{t("common.table.pageOf", { page: currentPage, totalPages })}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
						disabled={currentPage >= totalPages}
					>
						{t("common.button.next")}
					</Button>
					<ReactSelect
						className="ml-3 min-w-[140px]"
						options={perPageOptions}
						value={itemsPerPage}
						onChange={(value) => {
							const nextValue = typeof value === "number" ? value : parseInt(String(value ?? ""), 10)
							if (!Number.isNaN(nextValue)) {
								onItemsPerPageChange(nextValue)
								onPageChange(1)
							}
						}}
						isClearable={false}
						isSearchable={false}
					/>
				</div>
			</div>
		</div>
	)
}


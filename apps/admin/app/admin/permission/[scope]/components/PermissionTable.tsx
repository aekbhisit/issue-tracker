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

import { Permission } from "../types"
import { usePermissionTableColumns } from "./PermissionTableColumns"

interface PermissionTableProps {
	scope: string
	data: Permission[]
	loading?: boolean
	totalItems: number
	totalPages: number
	currentPage: number
	itemsPerPage: number
	sortField: string
	sortOrder: "asc" | "desc"
	onSort: (field: string, order: "asc" | "desc") => void
	onPageChange: (page: number) => void
	onItemsPerPageChange: (size: number) => void
}

export function PermissionTable({
	scope,
	data,
	loading = false,
	totalItems,
	totalPages,
	currentPage,
	itemsPerPage,
	sortField,
	sortOrder,
	onSort,
	onPageChange,
	onItemsPerPageChange,
}: PermissionTableProps) {
	const { t } = useTranslation()
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

	const sortingState = useMemo<SortingState>(
		() =>
			sortField
				? [{ id: sortField, desc: sortOrder === "desc" }]
				: [],
		[sortField, sortOrder],
	)

	const paginationState = useMemo<PaginationState>(
		() => ({ pageIndex: Math.max(currentPage - 1, 0), pageSize: itemsPerPage }),
		[currentPage, itemsPerPage],
	)

	const columns = usePermissionTableColumns({})

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

	const totalVisible = data.length
	const visibleColumnCount = Math.max(table.getVisibleLeafColumns().length, 1)
	const perPageOptions = useMemo<SelectOption[]>(
		() =>
			[10, 20, 50].map((size) => ({
				value: size,
				label: t("common.table.perPage", { count: size }),
			})),
		[t],
	)

	return (
		<div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
			<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center gap-3">
						<h3 className="text-lg font-medium text-gray-900 dark:text-white">
							{t("admin.permission.table.title")} ({scope})
						</h3>
					<span className="text-sm text-gray-500 dark:text-gray-400">
						{t("common.table.totalItems", { count: totalItems })}
					</span>
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
										className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${
											header.column.getCanSort()
												? "cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
												: ""
										}`}
										onClick={header.column.getToggleSortingHandler()}
									>
										<div className="flex items-center space-x-2">
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
					<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
						{loading ? (
							<tr>
								<td colSpan={visibleColumnCount} className="px-6 py-10">
									<DTLoading
										message={t("common.message.loading")}
										className="mx-auto w-full max-w-sm min-h-0 border-none p-0 shadow-none"
									/>
								</td>
							</tr>
						) : table.getRowModel().rows.length === 0 ? (
							<tr>
								<td colSpan={visibleColumnCount} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
									{t("common.message.noData")}
								</td>
							</tr>
						) : (
							table.getRowModel().rows.map((row) => (
								<tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="px-6 py-4 whitespace-nowrap">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			<div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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


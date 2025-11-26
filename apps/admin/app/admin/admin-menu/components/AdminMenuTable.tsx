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

import { AdminMenu } from "../types"
import { useAdminMenuTableColumns } from "./AdminMenuTableColumns"

interface AdminMenuTableProps {
	data: AdminMenu[]
	loading?: boolean
	totalItems: number
	totalPages: number
	currentPage: number
	itemsPerPage: number
	selectedIds: number[]
	onSelect: (menuId: number) => void
	onSelectAll: () => void
	onEdit: (menu: AdminMenu) => void
	onDelete: (menu: AdminMenu) => void
	onToggleStatus: (menu: AdminMenu) => void
	sortField: string
	sortOrder: "asc" | "desc"
	onSort: (field: string, order: "asc" | "desc") => void
	onPageChange: (page: number) => void
	onItemsPerPageChange: (itemsPerPage: number) => void
}

export function AdminMenuTable({
	data,
	loading = false,
	totalItems,
	totalPages,
	currentPage,
	itemsPerPage,
	selectedIds,
	onSelect,
	onSelectAll,
	onEdit,
	onDelete,
	onToggleStatus,
	sortField,
	sortOrder,
	onSort,
	onPageChange,
	onItemsPerPageChange,
}: AdminMenuTableProps) {
	const { t } = useTranslation()
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const sortingState = useMemo<SortingState>(
		() => (sortField ? [{ id: sortField, desc: sortOrder === "desc" }] : []),
		[sortField, sortOrder]
	)

	const columns = useAdminMenuTableColumns({
		onEdit,
		onDelete,
		onToggleStatus,
		onSelect: (menuId) => onSelect(menuId),
		isSelected: (menuId) => selectedIds.includes(menuId),
	})

	const totalVisible = data.length
	const selectedCount = selectedIds.length
	const allSelected = totalVisible > 0 && data.every((item) => selectedIds.includes(item.id))

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting: sortingState,
			columnFilters,
			pagination: {
				pageIndex: currentPage - 1,
				pageSize: itemsPerPage,
			},
		},
		onSortingChange: (updater) => {
			const newSorting = typeof updater === "function" ? updater(sortingState) : updater
			if (newSorting && newSorting.length > 0) {
				const sort = newSorting[0]
				onSort(sort.id, sort.desc ? "desc" : "asc")
			} else if (sortField) {
				onSort(sortField, sortOrder === "desc" ? "asc" : "desc")
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		manualPagination: true,
		manualSorting: true,
		pageCount: totalPages,
		enableSortingRemoval: false,
	})

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
		<div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
			<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<h3 className="text-lg font-medium text-gray-900 dark:text-white">
							{t("admin.admin_menu.toolbar.title")}
						</h3>
						<span className="text-sm text-gray-500 dark:text-gray-400">
							{t("common.table.totalItems", { count: totalItems })}
						</span>
						{selectedCount > 0 && (
							<span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
								{t("common.table.selectedCount", { count: selectedCount })}
							</span>
						)}
					</div>
					<Button
						variant="outline"
						className="text-sm"
						onClick={totalVisible === 0 ? undefined : onSelectAll}
						disabled={totalVisible === 0}
					>
						{allSelected ? t("common.table.deselectAll") : t("common.table.selectAll")}
					</Button>
				</div>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-gray-50 dark:bg-gray-700">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
									>
										{header.isPlaceholder ? null : (
											<div
												className={`flex items-center gap-2 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""
													}`}
												onClick={header.column.getToggleSortingHandler()}
											>
												{flexRender(header.column.columnDef.header, header.getContext())}
												{header.column.getCanSort() && (
													<span className="text-gray-400">
														{{
															asc: "↑",
															desc: "↓",
														}[header.column.getIsSorted() as string] ?? "↕"}
													</span>
												)}
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
								<tr
									key={row.id}
									className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
								>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
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


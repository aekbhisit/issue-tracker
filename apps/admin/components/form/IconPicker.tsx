"use client"

import React, { useState, useRef, useEffect } from "react"
import * as Icons from "@/public/icons/index"

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>

const iconList = Object.entries(Icons)
	.filter(([name, component]) => name !== "default" && typeof component === "function")
	.map(([name, component]) => ({
		name,
		component: component as IconComponent,
	}))
	.sort((a, b) => a.name.localeCompare(b.name))

interface IconPickerProps {
	id?: string
	name?: string
	label?: string
	value: string
	onChange: (value: string) => void
	placeholder?: string
	error?: string
}


const ICONS_PER_PAGE = 25

export default function IconPicker({
	id,
	name,
	label,
	value,
	onChange,
	placeholder,
	error,
}: IconPickerProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const [currentPage, setCurrentPage] = useState(0)
	const dropdownRef = useRef<HTMLDivElement>(null)

	// Filter icons by search query
	const filteredIcons = iconList.filter((icon) =>
		icon.name.toLowerCase().includes(searchQuery.toLowerCase())
	)

	// Calculate pagination
	const totalPages = Math.ceil(filteredIcons.length / ICONS_PER_PAGE)
	const startIndex = currentPage * ICONS_PER_PAGE
	const endIndex = startIndex + ICONS_PER_PAGE
	const currentIcons = filteredIcons.slice(startIndex, endIndex)

	// Get selected icon component
	const selectedIcon = iconList.find((icon) => icon.name === value)
	const SelectedIconComponent = selectedIcon?.component

	// Handle click outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside)
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [isOpen])

	// Reset to first page when search changes
	useEffect(() => {
		setCurrentPage(0)
	}, [searchQuery])

	const handleIconSelect = (iconName: string) => {
		onChange(iconName)
		setIsOpen(false)
		setSearchQuery("")
		setCurrentPage(0)
	}

	const handlePreviousPage = () => {
		setCurrentPage((prev) => Math.max(0, prev - 1))
	}

	const handleNextPage = () => {
		setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
	}

	return (
		<div className="w-full">
			{label && (
				<label
					htmlFor={id}
					className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					{label}
				</label>
			)}

			<div className="relative" ref={dropdownRef}>
				{/* Trigger Button */}
				<button
					type="button"
					id={id}
					name={name}
					onClick={() => setIsOpen(!isOpen)}
					className={`w-full flex items-center justify-between px-4 py-3 text-left border rounded-lg bg-white dark:bg-gray-800 transition-colors ${
						error
							? "border-red-500 focus:ring-red-500"
							: "border-gray-300 dark:border-gray-700 focus:ring-brand-500"
					} focus:outline-none focus:ring-2 focus:ring-offset-0`}
				>
					<div className="flex items-center gap-3 min-w-0 flex-1">
						{SelectedIconComponent ? (
							<>
								<div className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-gray-700 dark:text-gray-300">
									<div className="scale-[0.7] origin-center">
										<SelectedIconComponent />
									</div>
								</div>
								<span className="text-sm text-gray-900 dark:text-white truncate">{value}</span>
							</>
						) : (
							<span className="text-sm text-gray-500 dark:text-gray-400">
								{placeholder || "Select icon"}
							</span>
						)}
					</div>
					<Icons.ChevronDownIcon
						className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform ${
							isOpen ? "rotate-180" : ""
						}`}
					/>
				</button>

				{/* Dropdown */}
				{isOpen && (
					<div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
						{/* Search Input */}
						<div className="p-3 border-b border-gray-200 dark:border-gray-700">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search icons..."
								className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
							/>
						</div>

						{/* Icon Grid */}
						<div className="p-3">
							{currentIcons.length > 0 ? (
								<div className="grid grid-cols-5 gap-2">
									{currentIcons.map((icon) => {
										const IconComponent = icon.component
										const isSelected = value === icon.name

										return (
											<button
												key={icon.name}
												type="button"
												onClick={() => handleIconSelect(icon.name)}
												className={`group relative flex items-center justify-center p-3 rounded-lg border transition-all min-h-[52px] ${
													isSelected
														? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
														: "border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-gray-50 dark:hover:bg-gray-700"
												}`}
												title={icon.name}
											>
												<div
													className={`w-6 h-6 flex items-center justify-center ${
														isSelected
															? "text-brand-600 dark:text-brand-400"
															: "text-gray-700 dark:text-gray-300"
													}`}
												>
													<div className="scale-90 origin-center">
														<IconComponent />
													</div>
												</div>

												{/* Tooltip */}
												<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
													{icon.name}
												</div>
											</button>
										)
									})}
								</div>
							) : (
								<div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
									No icons found
								</div>
							)}
						</div>

						{/* Pagination */}
						{filteredIcons.length > ICONS_PER_PAGE && (
							<div className="flex items-center justify-between px-3 py-3 border-t border-gray-200 dark:border-gray-700">
								<button
									type="button"
									onClick={handlePreviousPage}
									disabled={currentPage === 0}
									className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									Previous
								</button>

								<span className="text-sm text-gray-600 dark:text-gray-400">
									Page {currentPage + 1} of {totalPages}
								</span>

								<button
									type="button"
									onClick={handleNextPage}
									disabled={currentPage === totalPages - 1}
									className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									Next
								</button>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Error Message */}
			{error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
		</div>
	)
}


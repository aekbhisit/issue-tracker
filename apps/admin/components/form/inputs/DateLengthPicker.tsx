"use client"

import { useEffect, useRef, useState } from "react"
import flatpickr from "flatpickr"
import "flatpickr/dist/flatpickr.css"
import { useTranslation } from "react-i18next"
import Button from "@/components/ui/button/Button"
import { CalendarIcon } from "@/public/icons/index"

export interface DateRangeValue {
	from: string | null
	to: string | null
}

interface DateLengthPickerProps {
	id: string
	value: DateRangeValue
	onChange: (from: string | null, to: string | null) => void
	label?: string
	placeholder?: string
	className?: string
}

type PresetType = "today" | "last7Days" | "last30Days" | "thisMonth" | "lastMonth" | "thisYear" | "custom"

export default function DateLengthPicker({
	id,
	value,
	onChange,
	label,
	placeholder,
	className = "",
}: DateLengthPickerProps) {
	const { t } = useTranslation()
	const flatpickrRef = useRef<flatpickr.Instance | null>(null)
	const inputRef = useRef<HTMLInputElement | null>(null)
	const [selectedPreset, setSelectedPreset] = useState<PresetType | null>(null)

	// Initialize flatpickr
	useEffect(() => {
		if (!inputRef.current) return

		const flatPickr = flatpickr(`#${id}`, {
			mode: "range",
			static: true,
			monthSelectorType: "static",
			dateFormat: "Y-m-d",
			defaultDate: value.from && value.to ? [value.from, value.to] : undefined,
			onChange: (selectedDates, dateStr) => {
				if (selectedDates.length === 2) {
					const from = dateStr.split(" to ")[0] || null
					const to = dateStr.split(" to ")[1] || null
					onChange(from, to)
					setSelectedPreset("custom")
				} else if (selectedDates.length === 0) {
					onChange(null, null)
					setSelectedPreset(null)
				}
			},
		})

		flatpickrRef.current = Array.isArray(flatPickr) ? flatPickr[0] || null : flatPickr

		return () => {
			if (flatPickr && !Array.isArray(flatPickr)) {
				flatPickr.destroy()
			}
		}
	}, [id, onChange])

	// Update flatpickr when value changes externally
	useEffect(() => {
		if (flatpickrRef.current && !Array.isArray(flatpickrRef.current)) {
			if (value.from && value.to) {
				flatpickrRef.current.setDate([value.from, value.to], false)
			} else if (!value.from && !value.to) {
				flatpickrRef.current.clear()
				setSelectedPreset(null)
			}
		}
	}, [value.from, value.to])

	// Update selectedPreset when value changes
	useEffect(() => {
		if (!value.from || !value.to) {
			setSelectedPreset(null)
			return
		}

		// Check if current value matches any preset
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		// Check today
		if (value.from === value.to && value.from === today.toISOString().split("T")[0]) {
			setSelectedPreset("today")
			return
		}

		// Check last 7 days
		const last7DaysFrom = new Date(today)
		last7DaysFrom.setDate(last7DaysFrom.getDate() - 6)
		if (
			value.from === last7DaysFrom.toISOString().split("T")[0] &&
			value.to === today.toISOString().split("T")[0]
		) {
			setSelectedPreset("last7Days")
			return
		}

		// Check last 30 days
		const last30DaysFrom = new Date(today)
		last30DaysFrom.setDate(last30DaysFrom.getDate() - 29)
		if (
			value.from === last30DaysFrom.toISOString().split("T")[0] &&
			value.to === today.toISOString().split("T")[0]
		) {
			setSelectedPreset("last30Days")
			return
		}

		// Check this month
		const thisMonthFrom = new Date(today.getFullYear(), today.getMonth(), 1)
		const thisMonthTo = new Date(today.getFullYear(), today.getMonth() + 1, 0)
		if (
			value.from === thisMonthFrom.toISOString().split("T")[0] &&
			value.to === thisMonthTo.toISOString().split("T")[0]
		) {
			setSelectedPreset("thisMonth")
			return
		}

		// Check last month
		const lastMonthFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1)
		const lastMonthTo = new Date(today.getFullYear(), today.getMonth(), 0)
		if (
			value.from === lastMonthFrom.toISOString().split("T")[0] &&
			value.to === lastMonthTo.toISOString().split("T")[0]
		) {
			setSelectedPreset("lastMonth")
			return
		}

		// Check this year
		const thisYearFrom = new Date(today.getFullYear(), 0, 1)
		const thisYearTo = new Date(today.getFullYear(), 11, 31)
		if (
			value.from === thisYearFrom.toISOString().split("T")[0] &&
			value.to === thisYearTo.toISOString().split("T")[0]
		) {
			setSelectedPreset("thisYear")
			return
		}

		// If no preset matches, it's custom
		if (value.from && value.to) {
			setSelectedPreset("custom")
		}
	}, [value.from, value.to])

	// Calculate date ranges for presets
	const getPresetDates = (preset: PresetType): { from: string; to: string } | null => {
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		switch (preset) {
			case "today": {
				const from = today.toISOString().split("T")[0]
				const to = today.toISOString().split("T")[0]
				return { from, to }
			}
			case "last7Days": {
				const from = new Date(today)
				from.setDate(from.getDate() - 6)
				return { from: from.toISOString().split("T")[0], to: today.toISOString().split("T")[0] }
			}
			case "last30Days": {
				const from = new Date(today)
				from.setDate(from.getDate() - 29)
				return { from: from.toISOString().split("T")[0], to: today.toISOString().split("T")[0] }
			}
			case "thisMonth": {
				const from = new Date(today.getFullYear(), today.getMonth(), 1)
				const to = new Date(today.getFullYear(), today.getMonth() + 1, 0)
				return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] }
			}
			case "lastMonth": {
				const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
				const to = new Date(today.getFullYear(), today.getMonth(), 0)
				return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] }
			}
			case "thisYear": {
				const from = new Date(today.getFullYear(), 0, 1)
				const to = new Date(today.getFullYear(), 11, 31)
				return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] }
			}
			default:
				return null
		}
	}

	const handlePresetClick = (preset: PresetType) => {
		const dates = getPresetDates(preset)
		if (dates) {
			onChange(dates.from, dates.to)
			setSelectedPreset(preset)
		}
	}

	const handleClear = () => {
		onChange(null, null)
		setSelectedPreset(null)
		if (flatpickrRef.current && !Array.isArray(flatpickrRef.current)) {
			flatpickrRef.current.clear()
		}
	}

	const presetButtons: { preset: PresetType; translationKey: string }[] = [
		{ preset: "today", translationKey: "common.dateRange.today" },
		{ preset: "last7Days", translationKey: "common.dateRange.last7Days" },
		{ preset: "last30Days", translationKey: "common.dateRange.last30Days" },
		{ preset: "thisMonth", translationKey: "common.dateRange.thisMonth" },
		{ preset: "lastMonth", translationKey: "common.dateRange.lastMonth" },
		{ preset: "thisYear", translationKey: "common.dateRange.thisYear" },
	]

	return (
		<div className={className}>
			{label && (
				<label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					{label}
				</label>
			)}

			{/* Preset buttons and date picker input */}
			<div className="flex flex-wrap items-center gap-2">
				{/* All button */}
				<Button
					variant={!value.from && !value.to ? "primary" : "outline"}
					size="sm"
					onClick={handleClear}
					type="button"
					className={
						!value.from && !value.to
							? "bg-brand-500 text-white hover:bg-brand-600"
							: ""
					}
				>
					{t("common.dateRange.all")}
				</Button>
				{presetButtons.map(({ preset, translationKey }) => (
					<Button
						key={preset}
						variant={selectedPreset === preset ? "primary" : "outline"}
						size="sm"
						onClick={() => handlePresetClick(preset)}
						type="button"
						className={
							selectedPreset === preset
								? "bg-brand-500 text-white hover:bg-brand-600"
								: ""
						}
					>
						{t(translationKey)}
					</Button>
				))}
				{/* Date picker input */}
				<div className="relative flex-1 min-w-[200px]">
					<input
						ref={inputRef}
						id={id}
						placeholder={placeholder || t("common.dateRange.custom")}
						className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
					/>
					<span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
						<CalendarIcon className="size-6" />
					</span>
				</div>
			</div>
		</div>
	)
}


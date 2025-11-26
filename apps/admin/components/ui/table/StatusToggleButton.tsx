"use client"

interface StatusToggleButtonProps {
	isActive: boolean
	onToggle: () => void
	activeLabel: string
	inactiveLabel: string
	disabled?: boolean
}

export function StatusToggleButton({
	isActive,
	onToggle,
	activeLabel,
	inactiveLabel,
	disabled = false,
}: StatusToggleButtonProps) {
	const baseClasses =
		"inline-flex items-center border rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"

	const stateClasses = isActive
		? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-500 dark:hover:bg-green-700 dark:border-green-500"
		: "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-500"

	return (
		<button type="button" onClick={onToggle} className={`${baseClasses} ${stateClasses}`} disabled={disabled}>
			<span
				className={`mr-2 h-2.5 w-2.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"} shadow-sm`}
				aria-hidden
			/>
			{isActive ? activeLabel : inactiveLabel}
		</button>
	)
}



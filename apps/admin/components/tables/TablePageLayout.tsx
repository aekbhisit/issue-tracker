"use client"

import type { ReactNode } from "react"

interface TablePageLayoutProps {
	children: ReactNode
	className?: string
}

export function TablePageLayout({ children, className }: TablePageLayoutProps) {
	const baseClass = "space-y-6"
	return <div className={className ? `${baseClass} ${className}` : baseClass}>{children}</div>
}

interface TableSectionProps {
	children: ReactNode
	className?: string
}

export function TableToolbar({ children, className }: TableSectionProps) {
	const baseClass =
		"rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
	return <section className={className ? `${baseClass} ${className}` : baseClass}>{children}</section>
}

export function TableSection({ children, className }: TableSectionProps) {
	const baseClass = "rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
	return <section className={className ? `${baseClass} ${className}` : baseClass}>{children}</section>
}

export function TableFooter({ children, className }: TableSectionProps) {
	const baseClass =
		"rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:p-6"
	return <footer className={className ? `${baseClass} ${className}` : baseClass}>{children}</footer>
}



"use client"

import { ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'

interface FileManagerToolbarProps {
	searchEnabled: boolean
	searchValue: string
	onSearchChange: (value: string) => void
	onSearchSubmit: () => void
	onRefresh: () => void
	onCreateFolder: () => void
	onUploadClick: () => void
	onNavigateUp: () => void
	canNavigateUp: boolean
	isCompactGrid: boolean
	onToggleGrid: () => void
	features: {
		upload?: boolean
		folders?: boolean
	}
}

export function FileManagerToolbar({
	searchEnabled,
	searchValue,
	onSearchChange,
	onSearchSubmit,
	onRefresh,
	onCreateFolder,
	onUploadClick,
	onNavigateUp,
	canNavigateUp,
	isCompactGrid,
	onToggleGrid,
	features,
}: FileManagerToolbarProps) {
	const { t } = useTranslation()

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault()
		onSearchSubmit()
	}

	const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		onSearchChange(event.target.value)
	}

	return (
		<div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
			<div>
				<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
					{t('admin.fileManager.pageTitle')}
				</h2>
				<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
					{t('admin.fileManager.pageDescription')}
				</p>
			</div>
		<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<form onSubmit={handleSubmit} className="flex flex-1 items-center gap-3">
				<button
					type="button"
					onClick={onNavigateUp}
					disabled={!canNavigateUp}
					className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					{t('admin.fileManager.toolbar.back')}
				</button>
				{searchEnabled && (
					<div className="relative flex-1">
						<input
							type="text"
							value={searchValue}
							onChange={handleInputChange}
							placeholder={t('admin.fileManager.toolbar.searchPlaceholder')}
							className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
						/>
						<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
							<svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M9.5 17a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
							</svg>
						</span>
					</div>
				)}
				{searchEnabled && (
			<button
				type="submit"
				className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-3 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
				aria-label={t('admin.fileManager.toolbar.searchAria')}
			>
				<svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M9.5 17a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
				</svg>
			</button>
				)}
			</form>
			<div className="flex flex-wrap items-center gap-3">
				<button
					type="button"
					onClick={onToggleGrid}
					className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-3 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
					aria-label={t('admin.fileManager.toolbar.toggleColumns')}
				>
					{isCompactGrid ? (
						<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
						</svg>
					) : (
						<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M3 4h5v5H3V4zm7 0h5v5h-5V4zm7 0h4v5h-4V4zM3 10h5v5H3v-5zm7 0h5v5h-5v-5zm7 0h4v5h-4v-5zM3 16h5v5H3v-5zm7 0h5v5h-5v-5zm7 0h4v5h-4v-5z" />
						</svg>
					)}
				</button>
				<button
					type="button"
					onClick={onRefresh}
					className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					<svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" d="M4.93 4.93a10 10 0 0 1 14.14 0l.7.7m-14.84 0 2.83 2.83m12.01-2.83-2.83 2.83M19.07 19.07a10 10 0 0 1-14.14 0l-.7-.7m14.84 0-2.83-2.83m-12.01 2.83 2.83-2.83" />
					</svg>
					{t('admin.fileManager.toolbar.refresh')}
				</button>
				{features.folders !== false && (
					<button
						type="button"
						onClick={onCreateFolder}
						className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
					>
						<svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v2M4 6h16M4 6v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10M12 11v6m-3-3h6" />
						</svg>
						{t('admin.fileManager.toolbar.newFolder')}
					</button>
				)}
				{features.upload !== false && (
				<button
					type="button"
					onClick={onUploadClick}
					className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					<svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 12V4m0 0-4 4m4-4 4 4" />
						</svg>
						{t('admin.fileManager.toolbar.upload')}
					</button>
				)}
			</div>
		</div>
		</div>
	)
}


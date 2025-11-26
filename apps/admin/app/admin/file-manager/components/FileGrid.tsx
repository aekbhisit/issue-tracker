"use client"

import { useTranslation } from 'react-i18next'
import type { FileManagerItem } from '../types'

const formatBytes = (bytes: number) => {
	if (!bytes) return '0 B'
	const units = ['B', 'KB', 'MB', 'GB', 'TB']
	const index = Math.floor(Math.log(bytes) / Math.log(1024))
	const value = bytes / Math.pow(1024, index)
	return `${value.toFixed(value >= 10 || value % 1 === 0 ? 0 : 1)} ${units[index]}`
}

interface FileGridProps {
	items: FileManagerItem[]
	mode: 'manage' | 'select'
	selectedPath?: string | null
	onOpen: (item: FileManagerItem) => void
	onPreview: (item: FileManagerItem) => void
	onRename: (item: FileManagerItem) => void
	onDelete: (item: FileManagerItem) => void
	onContextMenu: (item: FileManagerItem, event: React.MouseEvent<HTMLDivElement>) => void
	onSelect?: (item: FileManagerItem) => void
	isCompact?: boolean
	features: {
		rename?: boolean
		delete?: boolean
		preview?: boolean
	}
}

const isImage = (mimetype?: string) => mimetype?.startsWith('image/')
const isVideo = (mimetype?: string) => mimetype?.startsWith('video/')
const isAudio = (mimetype?: string) => mimetype?.startsWith('audio/')
const isDocument = (mimetype?: string) =>
	mimetype
		? [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'text/plain',
			'text/csv',
		].includes(mimetype)
		: false

const buildFullImageUrl = (path: string) => {
	if (!path) {
		return path
	}
	if (/^https?:\/\//i.test(path)) {
		return path
	}

	const normalizedPath = path.startsWith('/') ? path : `/${path}`
	const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')

	if (apiBase) {
		return `${apiBase}${normalizedPath}`
}
	if (typeof window !== 'undefined') {
		const origin = window.location.origin.replace(/\/$/, '')
		return `${origin}${normalizedPath}`
	}

	return normalizedPath
}

export function FileGrid({
	items,
	mode,
	selectedPath,
	onOpen,
	onPreview,
	onRename: _onRename, // kept for API compatibility (unused in minimalist layout)
	onDelete: _onDelete, // kept for API compatibility (unused in minimalist layout)
	onContextMenu,
	onSelect,
	isCompact = false,
	features,
}: FileGridProps) {
	const { t } = useTranslation()
	const gridClass = isCompact
		? 'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-4'
		: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'

	const cardSizeClass = isCompact ? 'h-44' : 'h-56'
	const iconSizeClass = isCompact ? 'text-base' : 'text-lg'

	if (!items.length) {
		return (
			<div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center dark:border-gray-700 dark:bg-gray-900/40">
				<p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('admin.fileManager.grid.emptyTitle')}</p>
				<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('admin.fileManager.grid.emptyDescription')}</p>
			</div>
		)
	}

	return (
		<div className={gridClass}>
			{items.map((item) => {
				const isFolder = item.type === 'folder'
				const isImg = isImage(item.mimetype) && !!item.url
				const isVid = isVideo(item.mimetype)
				const isAudioFile = isAudio(item.mimetype)
				const isDoc = isDocument(item.mimetype)

				if (!isFolder && !isImg && !isVid && !isAudioFile && !isDoc) {
					return null
				}

				const isSelected = item.path === selectedPath
				return (
					<div
						key={item.path}
						draggable={item.type === 'file'}
						onDragStart={(event) => {
							if (item.type === 'file') {
								event.stopPropagation()
								event.dataTransfer.setData('application/x-file-path', item.path)
								event.dataTransfer.effectAllowed = 'copy'
							} else {
								event.preventDefault()
							}
						}}
						onClick={() => onPreview(item)}
						onDoubleClick={() => {
							onOpen(item)
							if (mode === 'select' && item.type === 'file' && onSelect) {
								onSelect(item)
							}
						}}
						onContextMenu={(event) => {
							event.preventDefault()
							onContextMenu(item, event)
						}}
						className={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg dark:bg-gray-900 ${cardSizeClass} ${isSelected ? 'ring-2 ring-primary/60' : 'border border-transparent'}`}
					>
						<div className="flex w-full flex-1 items-center justify-center">
							{item.type === 'folder' ? (
								<svg className="h-full w-full max-h-24 max-w-24 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
									<path d="M3 6a2 2 0 0 1 2-2h4l2 2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />
								</svg>
							) : isImage(item.mimetype) && item.url ? (
								<div className="flex h-full w-full max-h-24 max-w-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700">
									<img src={buildFullImageUrl(item.url)} alt={item.name} className="h-full w-full object-cover" />
								</div>
							) : isVideo(item.mimetype) && item.url ? (
								<div className="flex h-full w-full max-h-24 max-w-24 overflow-hidden rounded-lg border border-gray-200 bg-black dark:border-gray-700">
									<video src={buildFullImageUrl(item.url)} className="h-full w-full object-cover" muted />
								</div>
							) : isAudio(item.mimetype) && item.url ? (
								<div className="flex h-full w-full max-h-24 max-w-24 items-center justify-center rounded-lg bg-indigo-100">
									<svg className="h-10 w-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-2v13" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19a3 3 0 006 0 3 3 0 00-6 0zm12 0a3 3 0 006 0 3 3 0 00-6 0z" />
									</svg>
								</div>
							) : isDocument(item.mimetype) ? (
								<div className="flex h-full w-full max-h-24 max-w-24 items-center justify-center rounded-lg bg-primary/10">
									<svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
										<path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.828a2 2 0 0 0-.586-1.414l-4.828-4.828A2 2 0 0 0 13.172 2H6zm6 2v5h5" />
									</svg>
								</div>
							) : null}
						</div>
						<div className="w-full select-none">
							<p className="truncate text-sm font-semibold text-gray-800 group-hover:text-primary dark:text-gray-100">
								{item.name}
							</p>
							<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
								{item.type === 'folder' ? t('admin.fileManager.grid.folderLabel') : formatBytes(item.size)}
							</p>
						</div>
					</div>
				)
			})}
		</div>
	)
}


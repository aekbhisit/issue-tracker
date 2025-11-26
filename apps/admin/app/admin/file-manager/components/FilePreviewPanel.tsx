"use client"

import type { FileManagerItem } from '../types'
import { useTranslation } from 'react-i18next'

const formatBytes = (bytes: number) => {
	if (!bytes) return '0 B'
	const units = ['B', 'KB', 'MB', 'GB', 'TB']
	const index = Math.floor(Math.log(bytes) / Math.log(1024))
	const value = bytes / Math.pow(1024, index)
	return `${value.toFixed(value >= 10 || value % 1 === 0 ? 0 : 1)} ${units[index]}`
}

interface FilePreviewPanelProps {
	item: FileManagerItem | null
	onClose: () => void
	onSelect?: (item: FileManagerItem) => void
	mode: 'manage' | 'select'
}

const isImage = (mimetype?: string) => mimetype?.startsWith('image/')
const isVideo = (mimetype?: string) => mimetype?.startsWith('video/')
const isPdf = (mimetype?: string) => mimetype === 'application/pdf'

export function FilePreviewPanel({ item, onClose, onSelect, mode }: FilePreviewPanelProps) {
	const { t } = useTranslation()

	if (!item || item.type === 'folder') {
		return (
			<div className="hidden rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 xl:flex xl:min-h-[24rem] xl:flex-col xl:items-center xl:justify-center">
				<p>{t('admin.fileManager.preview.empty')}</p>
			</div>
		)
	}

	const { name, mimetype, url, size, modifiedAt } = item

	return (
		<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
			<div className="flex items-start justify-between">
				<div className="max-w-[70%]">
					<h3 className="truncate text-base font-semibold text-gray-800 dark:text-gray-100" title={name}>{name}</h3>
					<p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400" title={mimetype || t('admin.fileManager.preview.typeFallback')}>
						{mimetype || t('admin.fileManager.preview.typeFallback')}
					</p>
				</div>
				<button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
					{t('admin.fileManager.preview.close')}
				</button>
			</div>
			<div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
				<p>{t('admin.fileManager.preview.fileSize', { value: formatBytes(size) })}</p>
				<p>{t('admin.fileManager.preview.lastUpdated', { value: new Date(modifiedAt).toLocaleString() })}</p>
			</div>
			{url && (
				<div className="mt-4 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
					{isImage(mimetype) && <img src={url} alt={name} className="max-h-64 w-full object-contain" />}
					{isVideo(mimetype) && (
						<video controls src={url} className="max-h-64 w-full" />
					)}
					{isPdf(mimetype) && (
						<iframe src={url} title={name} className="h-64 w-full" />
					)}
					{!isImage(mimetype) && !isVideo(mimetype) && !isPdf(mimetype) && (
						<div className="flex h-32 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
							{t('admin.fileManager.preview.previewUnavailable')}
						</div>
					)}
				</div>
			)}
			{url && (
				<div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
					<a
						href={url}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
					>
						{t('admin.fileManager.preview.open')}
					</a>
					<a
						href={url}
						target="_blank"
						rel="noreferrer"
						download
						className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
					>
						{t('admin.fileManager.preview.download')}
					</a>
					{mode === 'select' && onSelect && (
						<button
							onClick={() => onSelect(item)}
							className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 font-medium text-white transition hover:bg-primary/90"
						>
							{t('admin.fileManager.preview.use')}
						</button>
					)}
				</div>
			)}
		</div>
	)
}


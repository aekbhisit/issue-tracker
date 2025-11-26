"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useNotification } from '@/hooks/useNotification'
import ToastContainer from '@/components/ui/notification/ToastContainer'
import ConfirmModal from '@/components/ui/notification/ConfirmModal'

import { useFileManagerConfig } from '@/hooks/useFileManagerConfig'
import { FileManagerApiService } from '../api'
import type { FileManagerItem, FileManagerResponse, FileMetadataPayload } from '../types'

import { FileManagerToolbar } from './FileManagerToolbar'
import { FileGrid } from './FileGrid'
import { FilePreviewPanel } from './FilePreviewPanel'
import { InputModal } from './InputModal'
import { DTLoading } from '@/components/ui/loading'

type FileManagerMode = 'manage' | 'select'

interface FileManagerBrowserProps {
	mode?: FileManagerMode
	initialPath?: string
	onSelect?: (payload: FileMetadataPayload) => void
}

export function FileManagerBrowser({ mode = 'manage', initialPath = '', onSelect }: FileManagerBrowserProps) {
	const { t } = useTranslation()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [currentPath, setCurrentPath] = useState(initialPath ?? '')
	const [items, setItems] = useState<FileManagerItem[]>([])
	const [breadcrumbs, setBreadcrumbs] = useState<FileManagerResponse['breadcrumbs']>([])
	const [searchValue, setSearchValue] = useState('')
	const [searchKeyword, setSearchKeyword] = useState<string | undefined>(undefined)
	const [previewItem, setPreviewItem] = useState<FileManagerItem | null>(null)
	const [selectedPath, setSelectedPath] = useState<string | null>(null)
	const [renameTarget, setRenameTarget] = useState<FileManagerItem | null>(null)
	const [isFolderModalOpen, setFolderModalOpen] = useState(false)
	const [isRenameModalOpen, setRenameModalOpen] = useState(false)
	const [isCompactGrid, setIsCompactGrid] = useState(false)
	const [isDragActive, setIsDragActive] = useState(false)
	const [contextMenu, setContextMenu] = useState<{
		isOpen: boolean
		x: number
		y: number
		item: FileManagerItem | null
	}>({
		isOpen: false,
		x: 0,
		y: 0,
		item: null,
	})

	const currentPathRef = useRef(initialPath ?? '')
	const searchKeywordRef = useRef<string | undefined>(undefined)
	const selectedPathRef = useRef<string | null>(null)
	const dragCounterRef = useRef(0)
	const dropZoneRef = useRef<HTMLDivElement | null>(null)
	const contextMenuRef = useRef<HTMLDivElement | null>(null)

	const {
		toasts,
		confirmState,
		showSuccess,
		showError,
		showInfo,
		showConfirm,
		removeToast,
		handleConfirm,
		handleCancel,
	} = useNotification()
	const { config } = useFileManagerConfig()

	const features = useMemo(() => config.features ?? {}, [config.features])
	const gridHeight = config.gridHeight ?? 500

	const closeContextMenu = useCallback(() => {
		setContextMenu({
			isOpen: false,
			x: 0,
			y: 0,
			item: null,
		})
	}, [])

	useEffect(() => {
		if (!contextMenu.isOpen) {
			return
		}

		const handleMouseDown = (event: MouseEvent) => {
			const target = event.target as Node
			if (contextMenuRef.current && !contextMenuRef.current.contains(target)) {
				closeContextMenu()
			}
		}

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				closeContextMenu()
			}
		}

		document.addEventListener('mousedown', handleMouseDown)
		document.addEventListener('keydown', handleEscape)

		return () => {
			document.removeEventListener('mousedown', handleMouseDown)
			document.removeEventListener('keydown', handleEscape)
		}
	}, [contextMenu.isOpen, closeContextMenu])

	const loadItems = useCallback(async (params: { path?: string; search?: string } = {}) => {
		const targetPath = typeof params.path !== 'undefined' ? params.path : currentPathRef.current
		const targetSearch = typeof params.search !== 'undefined' ? params.search : searchKeywordRef.current

		try {
			setIsLoading(true)
			const response = await FileManagerApiService.list({
				path: targetPath,
				search: targetSearch,
			})
			setItems(response.items)
			setBreadcrumbs(response.breadcrumbs)
			setCurrentPath(response.currentPath)
			currentPathRef.current = response.currentPath
			setSearchKeyword(response.search)
			searchKeywordRef.current = response.search
			if (selectedPathRef.current && !response.items.some((item) => item.path === selectedPathRef.current)) {
				setSelectedPath(null)
				selectedPathRef.current = null
			}
			if (response.items.length === 0) {
				setPreviewItem(null)
				setSelectedPath(null)
				selectedPathRef.current = null
			}
		} catch (error: any) {
			showError({ message: error?.message || t('admin.fileManager.notifications.loadError') })
		} finally {
			setIsLoading(false)
		}
	}, [showError, t])

	useEffect(() => {
		const resolvedInitialPath = initialPath ?? ''
		currentPathRef.current = resolvedInitialPath
		searchKeywordRef.current = undefined
		setCurrentPath(resolvedInitialPath)
		setSearchKeyword(undefined)
		setSearchValue('')
		setPreviewItem(null)
		setSelectedPath(null)
		selectedPathRef.current = null
		loadItems({ path: resolvedInitialPath, search: undefined })
	}, [initialPath, loadItems])

	const handleRefresh = () => {
		loadItems()
	}

	const handleSearchSubmit = () => {
		const keyword = searchValue.trim()
		const normalized = keyword.length > 0 ? keyword : undefined
		setSearchKeyword(normalized)
		searchKeywordRef.current = normalized
		loadItems({ search: normalized })
	}

	const handleNavigateUp = () => {
		if (!currentPath) return
		const parentSegments = currentPath.split('/').filter(Boolean)
		parentSegments.pop()
		const normalizedPath = parentSegments.join('/')
		setSearchValue('')
		setSearchKeyword(undefined)
		searchKeywordRef.current = undefined
		currentPathRef.current = normalizedPath
		setCurrentPath(normalizedPath)
		loadItems({ path: normalizedPath, search: undefined })
	}

	const handleOpenItem = (item: FileManagerItem) => {
		if (item.type === 'folder') {
			setSearchValue('')
			setSearchKeyword(undefined)
			searchKeywordRef.current = undefined
			setPreviewItem(null)
			setSelectedPath(null)
			selectedPathRef.current = null
			loadItems({ path: item.path, search: undefined })
			return
		}

		setPreviewItem(item)
		setSelectedPath(item.path)
		selectedPathRef.current = item.path

		if (mode === 'select' && onSelect && item.url) {
			const payload: FileMetadataPayload = {
				url: item.url,
				name: item.name,
				mimetype: item.mimetype,
				size: item.size,
			}
			onSelect(payload)
		}
	}

	const handlePreview = (item: FileManagerItem) => {
		setSelectedPath(item.path)
		selectedPathRef.current = item.path

		if (item.type === 'folder') {
			setPreviewItem(null)
			return
		}

		setPreviewItem(item)
	}

	const handleContextMenu = (item: FileManagerItem, event: React.MouseEvent<HTMLDivElement>) => {
		event.preventDefault()
		event.stopPropagation()

		const containerRect = dropZoneRef.current?.getBoundingClientRect()
		const x = containerRect ? event.clientX - containerRect.left : event.clientX
		const y = containerRect ? event.clientY - containerRect.top : event.clientY

		setSelectedPath(item.path)
		selectedPathRef.current = item.path
		setPreviewItem(item.type === 'file' ? item : null)

		setContextMenu({
			isOpen: true,
			x,
			y,
			item,
		})
	}

	const handleContextOpen = () => {
		const item = contextMenu.item
		if (!item) return

		closeContextMenu()

		if (item.type === 'folder') {
			handleOpenItem(item)
			return
		}

		if (!item.url) {
			showError({ message: t('admin.fileManager.notifications.openUnsupported') })
			return
		}

		const fullUrl = buildFullUrl(item.url)
		if (typeof window !== 'undefined') {
			window.open(fullUrl, '_blank', 'noopener,noreferrer')
		}
	}

	const handleContextRename = () => {
		const item = contextMenu.item
		if (!item) return
		closeContextMenu()
		handleRename(item)
	}

	const handleContextDownload = () => {
		const item = contextMenu.item
		if (!item || item.type === 'folder' || !item.url) {
			showError({ message: t('admin.fileManager.notifications.downloadUnsupported') })
			return
		}

		closeContextMenu()

		const fullUrl = buildFullUrl(item.url)
		const link = document.createElement('a')
		link.href = fullUrl
		link.download = item.name
		link.rel = 'noopener'
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	const buildFullUrl = (path: string) => {
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

	const handleContextCopyUrl = async () => {
		const item = contextMenu.item
		if (!item || !item.url) {
			return
		}

		try {
			const fullUrl = buildFullUrl(item.url)
			await navigator.clipboard.writeText(fullUrl)
			showSuccess({ message: t('admin.fileManager.notifications.copyUrlSuccess') })
		} catch (error) {
			showError({ message: t('admin.fileManager.notifications.copyUrlError') })
		} finally {
			closeContextMenu()
		}
	}

	const handleContextDelete = () => {
		const item = contextMenu.item
		if (!item) return
		closeContextMenu()
		handleDelete(item)
	}

	const handleCreateFolder = () => {
		setFolderModalOpen(true)
	}

	const handleConfirmCreateFolder = async (name: string) => {
		try {
			const folder = await FileManagerApiService.createFolder(currentPath || undefined, name)
			showSuccess({ message: t('admin.fileManager.notifications.createSuccess', { name: folder.name }) })
			setFolderModalOpen(false)
			await loadItems()
		} catch (error: any) {
			showError({ message: error?.message || t('admin.fileManager.notifications.createError') })
		}
	}

	const handleRename = (item: FileManagerItem) => {
		setRenameTarget(item)
		setRenameModalOpen(true)
	}

	const handleConfirmRename = async (newName: string) => {
		if (!renameTarget) return
		try {
			await FileManagerApiService.rename(renameTarget.path, newName)
			showSuccess({ message: t('admin.fileManager.notifications.renameSuccess') })
			setRenameModalOpen(false)
			setRenameTarget(null)
			await loadItems()
		} catch (error: any) {
			showError({ message: error?.message || t('admin.fileManager.notifications.renameError') })
		}
	}

	const handleDelete = (item: FileManagerItem) => {
		showConfirm({
			title: t('admin.fileManager.confirm.deleteTitle'),
			message: item.type === 'folder'
				? t('admin.fileManager.confirm.deleteFolderMessage', { name: item.name })
				: t('admin.fileManager.confirm.deleteFileMessage', { name: item.name }),
			confirmText: t('admin.fileManager.confirm.deleteConfirm'),
			cancelText: t('admin.fileManager.inputModal.cancel'),
			onConfirm: async () => {
				try {
					await FileManagerApiService.remove(item.path)
					showSuccess({ message: t('admin.fileManager.notifications.deleteSuccess') })
					if (previewItem?.path === item.path) {
						setPreviewItem(null)
					}
					if (selectedPath === item.path) {
						setSelectedPath(null)
						selectedPathRef.current = null
					}
					await loadItems()
				} catch (error: any) {
					showError({ message: error?.message || t('admin.fileManager.notifications.deleteError') })
				}
			},
		})
	}

	const handleUploadClick = () => {
		fileInputRef.current?.click()
	}

	const uploadFiles = useCallback(async (files: File[]) => {
		const validFiles = files.filter((file) => file instanceof File)
		if (!validFiles.length) {
			return
		}
		try {
			await FileManagerApiService.upload(currentPathRef.current || undefined, validFiles)
			showSuccess({ message: t('admin.fileManager.notifications.uploadSuccess') })
			await loadItems()
		} catch (error: any) {
			showError({ message: error?.message || t('admin.fileManager.notifications.uploadError') })
		}
	}, [loadItems, showError, showSuccess, t])

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files ?? [])
		await uploadFiles(files)
		event.target.value = ''
	}

	const isInternalDrag = (event: React.DragEvent<HTMLDivElement>) =>
		Array.from(event.dataTransfer?.types ?? []).includes('application/x-file-path')

	const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		event.stopPropagation()
		if (isInternalDrag(event)) {
			return
		}
		dragCounterRef.current += 1
		setIsDragActive(true)
	}

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		event.stopPropagation()
		if (isInternalDrag(event)) {
			event.dataTransfer.dropEffect = 'none'
			return
		}
		event.dataTransfer.dropEffect = 'copy'
	}

	const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		event.stopPropagation()
		dragCounterRef.current = Math.max(dragCounterRef.current - 1, 0)
		if (dragCounterRef.current === 0) {
			setIsDragActive(false)
		}
	}

	const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		event.stopPropagation()
		dragCounterRef.current = 0
		setIsDragActive(false)

		if (isInternalDrag(event)) {
			return
		}

		const files = Array.from(event.dataTransfer?.files ?? [])
		if (files.length > 0) {
			await uploadFiles(files)
		}
	}

	const handleSelect = (item: FileManagerItem) => {
		if (!item.url || !onSelect) return
		console.log('[FileManager] selected item', {
			originalUrl: item.url,
			fullUrl: buildFullUrl(item.url),
			name: item.name,
			path: item.path,
			type: item.type,
		})
		const payload: FileMetadataPayload = {
			url: buildFullUrl(item.url),
			name: item.name,
			mimetype: item.mimetype,
			size: item.size,
		}
		onSelect(payload)
	}

	const canNavigateUp = breadcrumbs.length > 1
	const toggleGridColumns = () => setIsCompactGrid((prev) => !prev)

	return (
		<div className="space-y-6">
			<input
				type="file"
				multiple
				ref={fileInputRef}
				onChange={handleFileChange}
				className="hidden"
				accept={features.upload === false ? undefined : config.allowedMimeTypes?.join(',')}
			/>
			<FileManagerToolbar
				searchEnabled={features.search !== false}
				searchValue={searchValue}
				onSearchChange={setSearchValue}
				onSearchSubmit={handleSearchSubmit}
				onRefresh={handleRefresh}
				onCreateFolder={handleCreateFolder}
				onUploadClick={handleUploadClick}
				onNavigateUp={handleNavigateUp}
				canNavigateUp={canNavigateUp}
				isCompactGrid={isCompactGrid}
				onToggleGrid={toggleGridColumns}
				features={{ upload: features.upload, folders: features.folders }}
			/>
			<div className="space-y-3">
				<nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
					{breadcrumbs.map((crumb, index) => {
						const isLast = index === breadcrumbs.length - 1
						const targetPath = index === 0 ? '' : crumb.path || undefined
						return (
							<span key={crumb.path || `crumb-${index}`} className="flex items-center gap-2">
								<button
									type="button"
									disabled={isLast}
									onClick={() => {
									setSearchValue('')
									setSearchKeyword(undefined)
									currentPathRef.current = targetPath ?? ''
									searchKeywordRef.current = undefined
									setCurrentPath(currentPathRef.current)
									loadItems({ path: targetPath, search: undefined })
								}}
									className={`text-sm transition ${isLast ? 'cursor-default font-semibold text-primary' : 'hover:text-primary'}`}
								>
									{index === 0 ? t('admin.fileManager.breadcrumb.root') : crumb.name}
								</button>
								{!isLast && <span>/</span>}
							</span>
						)
					})}
				</nav>
				{searchKeyword && (
					<div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
						{t('admin.fileManager.search.results', { keyword: searchKeyword })}
					</div>
				)}
			</div>
			{isLoading ? (
				<div
					className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
					style={{ minHeight: gridHeight, height: gridHeight }}
				>
					<DTLoading
						message={t('common.message.loading')}
						className="mx-auto w-full max-w-sm min-h-0 border-none p-0 shadow-none"
					/>
				</div>
			) : (
				<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
					<div
						ref={dropZoneRef}
						className={`relative rounded-xl border transition ${
							isDragActive
								? 'border-primary border-dashed bg-primary/10'
								: 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
						}`}
						style={{ minHeight: gridHeight, height: gridHeight }}
						onDragEnter={handleDragEnter}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						onContextMenu={(event) => event.preventDefault()}
					>
						<div className="h-full w-full overflow-auto p-4">
							<FileGrid
								items={items}
								mode={mode}
								selectedPath={selectedPath}
								onOpen={handleOpenItem}
								onPreview={handlePreview}
								onRename={handleRename}
								onDelete={handleDelete}
								onSelect={mode === 'select' ? handleSelect : undefined}
								onContextMenu={handleContextMenu}
								isCompact={isCompactGrid}
								features={{
									rename: features.rename,
									delete: features.delete,
									preview: features.preview,
								}}
							/>
						</div>
						{isDragActive && (
							<div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl">
								<div className="rounded-xl border border-primary/40 bg-white/80 px-6 py-3 text-sm font-semibold text-primary shadow">
									{t('admin.fileManager.dropzone.hint')}
								</div>
							</div>
						)}
						{contextMenu.isOpen && contextMenu.item && (
							<div
								ref={contextMenuRef}
								className="absolute z-50 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900"
								style={{ top: contextMenu.y, left: contextMenu.x }}
							>
								<button
									type="button"
									onClick={handleContextOpen}
									className="flex w-full items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
								>
									<svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h7l2 2h7a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
									</svg>
									{contextMenu.item.type === 'folder' ? t('admin.fileManager.contextMenu.openFolder') : t('admin.fileManager.contextMenu.openFile')}
								</button>
								{[
									{
										key: 'rename',
										label: t('admin.fileManager.contextMenu.rename'),
										onClick: handleContextRename,
										disabled: false,
										icon: (
											<svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 0 1 2.971 2.971L8.872 18.419 4 19.64l1.221-4.872L16.862 4.487z" />
											</svg>
										),
									},
									{
										key: 'download',
										label: t('admin.fileManager.contextMenu.download'),
										onClick: handleContextDownload,
										disabled: !contextMenu.item.url || contextMenu.item.type === 'folder',
										icon: (
											<svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 3v12m0 0-4-4m4 4 4-4" />
											</svg>
										),
									},
									{
										key: 'copyUrl',
										label: t('admin.fileManager.contextMenu.copyUrl'),
										onClick: handleContextCopyUrl,
										disabled: !contextMenu.item.url,
										icon: (
											<svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" d="M8 7v9a2 2 0 0 0 2 2h7m0-12V5a2 2 0 0 0-2-2H8l-4 4v9a2 2 0 0 0 2 2h2" />
											</svg>
										),
									},
								].map((action) => (
									<button
										key={action.key}
										type="button"
										onClick={action.onClick}
										disabled={action.disabled}
										className="flex w-full items-center gap-2 px-4 py-2 text-left text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-gray-200 dark:hover:bg-gray-800 dark:disabled:text-gray-500"
									>
										{action.icon}
										{action.label}
									</button>
								))}
								<button
									type="button"
									onClick={handleContextDelete}
									className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
								>
									<svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v2m-4 0h14" />
									</svg>
									{t('admin.fileManager.contextMenu.delete')}
								</button>
							</div>
						)}
					</div>
					<FilePreviewPanel
						item={previewItem}
						onClose={() => setPreviewItem(null)}
						onSelect={mode === 'select' ? handleSelect : undefined}
						mode={mode}
					/>
				</div>
			)}

			<InputModal
				isOpen={isFolderModalOpen}
				title={t('admin.fileManager.modals.createTitle')}
				description={t('admin.fileManager.modals.createDescription')}
				placeholder={t('admin.fileManager.modals.createPlaceholder')}
				onConfirm={handleConfirmCreateFolder}
				onCancel={() => setFolderModalOpen(false)}
			/>

			<InputModal
				isOpen={isRenameModalOpen}
				title={t('admin.fileManager.modals.renameTitle')}
				description={renameTarget?.type === 'folder'
					? t('admin.fileManager.modals.renameDescriptionFolder')
					: t('admin.fileManager.modals.renameDescriptionFile')}
				initialValue={renameTarget?.name ?? ''}
				placeholder={t('admin.fileManager.modals.renamePlaceholder')}
				onConfirm={handleConfirmRename}
				onCancel={() => {
					setRenameModalOpen(false)
					setRenameTarget(null)
				}}
			/>

			<ToastContainer toasts={toasts} onRemoveToast={removeToast} />
			<ConfirmModal
				isOpen={confirmState.isOpen}
				title={confirmState.title}
				message={confirmState.message}
				confirmText={confirmState.confirmText}
				cancelText={confirmState.cancelText}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
			/>
		</div>
	)
}


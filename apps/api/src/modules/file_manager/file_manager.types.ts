export type FileManagerItemType = 'file' | 'folder'

export interface FileManagerConfig {
	requireAdmin: boolean
	rootDirectory: string
	previewBasePath: string
	maxUploadFileSizeMB: number
	allowedMimeTypes: string[]
	gridHeight?: number
	features?: Record<string, boolean>
}

export interface FileManagerBreadcrumb {
	name: string
	path: string
}

export interface FileManagerItem {
	name: string
	path: string
	type: FileManagerItemType
	url?: string
	mimetype?: string
	size: number
	modifiedAt: string
	fileCount?: number
}

export interface FileManagerListResponse {
	root: string
	currentPath: string
	search?: string
	breadcrumbs: FileManagerBreadcrumb[]
	items: FileManagerItem[]
	total: number
}

export interface FileManagerDeleteResult {
	path: string
	type: FileManagerItemType
}

export interface FileManagerRenameResult {
	path: string
	newPath: string
	type: FileManagerItemType
}

export interface FileManagerUploadResult extends FileManagerItem {
	originalName: string
}


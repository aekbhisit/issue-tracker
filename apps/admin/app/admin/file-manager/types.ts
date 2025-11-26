export type FileManagerItemType = 'file' | 'folder'

export interface FileManagerConfig {
	requireAdmin: boolean
	rootDirectory: string
	previewBasePath: string
	maxUploadFileSizeMB: number
	allowedMimeTypes: string[]
	gridHeight?: number
	features?: {
		upload?: boolean
		rename?: boolean
		delete?: boolean
		folders?: boolean
		search?: boolean
		preview?: boolean
		multiSelect?: boolean
	} | null
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

export interface FileManagerResponse {
	root: string
	currentPath: string
	search?: string
	breadcrumbs: FileManagerBreadcrumb[]
	items: FileManagerItem[]
	total: number
}

export interface FileMetadataPayload {
	url: string
	name: string
	mimetype?: string
	size: number
}


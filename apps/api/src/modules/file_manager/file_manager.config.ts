import { FileManagerConfig } from './file_manager.types'
import fs from 'fs'
import path from 'path'

// Try to load config from admin public folder, fallback to defaults
let fileManagerConfigJson: any = {}
try {
	const configPath = path.join(__dirname, '../../../../admin/public/config/filemanager.json')
	if (fs.existsSync(configPath)) {
		fileManagerConfigJson = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
	}
} catch (error) {
	// Use defaults if file doesn't exist or can't be read
	console.warn('Could not load filemanager.json, using defaults')
}

const config: FileManagerConfig = {
	requireAdmin: fileManagerConfigJson.requireAdmin ?? true,
	rootDirectory: fileManagerConfigJson.rootDirectory ?? 'uploads',
	previewBasePath: fileManagerConfigJson.previewBasePath ?? '/storage/uploads',
	maxUploadFileSizeMB: fileManagerConfigJson.maxUploadFileSizeMB ?? 50,
	allowedMimeTypes: Array.isArray(fileManagerConfigJson.allowedMimeTypes)
		? fileManagerConfigJson.allowedMimeTypes
		: [
			'image/jpeg',
			'image/png',
			'image/webp',
			'image/gif',
			'video/mp4',
			'video/webm',
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		],
	gridHeight: typeof fileManagerConfigJson.gridHeight === 'number'
		? fileManagerConfigJson.gridHeight
		: 500,
	features: typeof fileManagerConfigJson.features === 'object' ? fileManagerConfigJson.features : undefined,
}

export function getFileManagerConfig(): FileManagerConfig {
	return config
}


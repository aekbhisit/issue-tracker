import fs from 'fs/promises'
import path from 'path'
import { lookup as lookupMimeType } from 'mime-types'

import {
	FileManagerBreadcrumb,
	FileManagerConfig,
	FileManagerDeleteResult,
	FileManagerItem,
	FileManagerListResponse,
	FileManagerRenameResult,
	FileManagerUploadResult,
} from './file_manager.types'
import { getFileManagerConfig } from './file_manager.config'

const storageConfig: {
	getStorageRootPath: () => string
	ensureDirectoryExists: (dir: string) => void
} = require('../../shared/storage.config')

const DEFAULT_SEARCH_LIMIT = 200

export class FileManagerService {
	private readonly config: FileManagerConfig
	private readonly storageRoot: string
	private readonly absoluteRoot: string

	constructor() {
		this.config = getFileManagerConfig()
		this.storageRoot = storageConfig.getStorageRootPath()
		this.absoluteRoot = path.join(this.storageRoot, this.config.rootDirectory)
		storageConfig.ensureDirectoryExists(this.absoluteRoot)
	}

	getConfig(): FileManagerConfig {
		return this.config
	}

	private sanitizeRelativePath(relativePath?: string | null): string {
		if (!relativePath) {
			return ''
		}

		const normalized = path
			.posix
			.normalize(relativePath.replace(/\\/g, '/'))
			.replace(/^\/+/, '')

		if (normalized === '.' || normalized === '/') {
			return ''
		}

		const segments = normalized.split('/').filter((segment) => segment && segment !== '.' && segment !== '..')
		return segments.join('/')
	}

	private sanitizeName(name: string): string {
		return name
			.replace(/^[\.\s]+|[\s\.]+$/g, '')
			.replace(/[\r\n\t]+/g, ' ')
			.replace(/[\\/]+/g, '')
	}

	private resolveAbsolutePath(relativePath?: string | null) {
		const sanitized = this.sanitizeRelativePath(relativePath)
		const absolute = path.join(this.absoluteRoot, sanitized)

		if (!absolute.startsWith(this.absoluteRoot)) {
			throw new Error('Path is outside of root directory')
		}

		return { sanitized, absolute }
	}

	private buildBreadcrumbs(relativePath: string): FileManagerBreadcrumb[] {
		const breadcrumbs: FileManagerBreadcrumb[] = [
			{ name: 'root', path: '' },
		]

		if (!relativePath) {
			return breadcrumbs
		}

		const segments = relativePath.split('/')
		let current = ''

		for (const segment of segments) {
			current = current ? `${current}/${segment}` : segment
			breadcrumbs.push({
				name: segment,
				path: current,
			})
		}

		return breadcrumbs
	}

	private async getItem(relativePath: string, isDirectory: boolean): Promise<FileManagerItem> {
		const absolute = path.join(this.absoluteRoot, relativePath)
		const stats = await fs.stat(absolute)
		const name = path.basename(relativePath)
		const modifiedAt = stats.mtime.toISOString()
		let size: number
		let fileCount: number | undefined
		let mimetype: string | undefined
		let url: string | undefined

		if (isDirectory) {
			const directoryStats = await this.calculateDirectoryStats(absolute)
			size = directoryStats.size
			fileCount = directoryStats.fileCount
			mimetype = undefined
			url = undefined
		} else {
			size = stats.size
			mimetype = lookupMimeType(name) || undefined
			url = this.toPublicUrl(relativePath)
		}

		return {
			name,
			path: relativePath,
			type: isDirectory ? 'folder' : 'file',
			url,
			mimetype,
			size,
			modifiedAt,
			fileCount,
		}
	}

	private async calculateDirectoryStats(absolutePath: string): Promise<{ size: number; fileCount: number }> {
		const entries = await fs.readdir(absolutePath, { withFileTypes: true })
		let totalSize = 0
		let fileCount = 0

		for (const entry of entries) {
			const entryAbsolute = path.join(absolutePath, entry.name)
			if (entry.isDirectory()) {
				const childStats = await this.calculateDirectoryStats(entryAbsolute)
				totalSize += childStats.size
				fileCount += childStats.fileCount
			} else {
				const fileStats = await fs.stat(entryAbsolute)
				totalSize += fileStats.size
				fileCount += 1
			}
		}

		return { size: totalSize, fileCount }
	}

	private toPublicUrl(relativePath: string): string {
		const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
		return `${this.config.previewBasePath.replace(/\/$/, '')}/${normalized}`
	}

	private async walkDirectory(
		absoluteDir: string,
		relativeDir: string,
		keyword: string,
		items: FileManagerItem[],
		limit: number
	) {
		const dirEntries = await fs.readdir(absoluteDir, { withFileTypes: true })

		for (const entry of dirEntries) {
			if (items.length >= limit) {
				return
			}

			const entryRelative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name
			const entryAbsolute = path.join(absoluteDir, entry.name)

			if (entry.name.toLowerCase().includes(keyword)) {
				items.push(await this.getItem(entryRelative, entry.isDirectory()))
			}

			if (entry.isDirectory()) {
				await this.walkDirectory(entryAbsolute, entryRelative, keyword, items, limit)
			}
		}
	}

	async list(relativePath?: string, search?: string): Promise<FileManagerListResponse> {
		const { sanitized, absolute } = this.resolveAbsolutePath(relativePath)

		const items: FileManagerItem[] = []

		if (search?.trim()) {
			const keyword = search.trim().toLowerCase()
			await this.walkDirectory(absolute, sanitized, keyword, items, DEFAULT_SEARCH_LIMIT)
			items.sort((a, b) => a.name.localeCompare(b.name))
		} else {
			const dirEntries = await fs.readdir(absolute, { withFileTypes: true })
			for (const entry of dirEntries) {
				const entryRelative = sanitized ? `${sanitized}/${entry.name}` : entry.name
				items.push(await this.getItem(entryRelative, entry.isDirectory()))
			}
			items.sort((a, b) => {
				if (a.type === b.type) {
					return a.name.localeCompare(b.name)
				}
				return a.type === 'folder' ? -1 : 1
			})
		}

		return {
			root: this.config.previewBasePath,
			currentPath: sanitized,
			search: search?.trim() || undefined,
			breadcrumbs: this.buildBreadcrumbs(sanitized),
			items,
			total: items.length,
		}
	}

	async createFolder(relativePath: string | undefined, folderName: string): Promise<FileManagerItem> {
		const { sanitized: parentPath } = this.resolveAbsolutePath(relativePath)
		const safeName = this.sanitizeName(folderName)

		if (!safeName) {
			throw new Error('Invalid folder name')
		}

		const newRelativePath = parentPath ? `${parentPath}/${safeName}` : safeName
		const { absolute: newAbsolutePath } = this.resolveAbsolutePath(newRelativePath)

		await fs.mkdir(newAbsolutePath, { recursive: false }).catch((error: NodeJS.ErrnoException) => {
			if (error.code === 'EEXIST') {
				throw new Error('Folder already exists')
			}
			throw error
		})

		return this.getItem(newRelativePath, true)
	}

	async rename(relativePath: string, newName: string): Promise<FileManagerRenameResult> {
		const { sanitized } = this.resolveAbsolutePath(relativePath)
		const safeName = this.sanitizeName(newName)

		if (!sanitized) {
			throw new Error('Root directory cannot be renamed')
		}

		if (!safeName) {
			throw new Error('Invalid target name')
		}

		if (safeName.includes('/')) {
			throw new Error('Target name cannot contain path separators')
		}

		const currentAbsolute = path.join(this.absoluteRoot, sanitized)
		const stats = await fs.stat(currentAbsolute)

		if (!stats.isDirectory()) {
			const oldExt = path.extname(sanitized).toLowerCase()
			const newExt = path.extname(safeName).toLowerCase()
			if (oldExt !== newExt) {
				throw new Error('Changing file extension is not allowed')
			}
		}
		const parentRelative = sanitized.split('/').slice(0, -1).join('/')
		const newRelative = parentRelative ? `${parentRelative}/${safeName}` : safeName
		const newAbsolute = path.join(this.absoluteRoot, newRelative)

		await fs.access(newAbsolute).then(() => {
			throw new Error('Destination already exists')
		}).catch((error: NodeJS.ErrnoException) => {
			if (error.code !== 'ENOENT') {
				throw error
			}
		})

		await fs.rename(currentAbsolute, newAbsolute)

		return {
			path: sanitized,
			newPath: newRelative,
			type: stats.isDirectory() ? 'folder' : 'file',
		}
	}

	async delete(relativePath: string): Promise<FileManagerDeleteResult> {
		const { sanitized, absolute } = this.resolveAbsolutePath(relativePath)

		if (!sanitized) {
			throw new Error('Root directory cannot be deleted')
		}

		const stats = await fs.stat(absolute)

		await fs.rm(absolute, { force: true, recursive: stats.isDirectory() })

		return {
			path: sanitized,
			type: stats.isDirectory() ? 'folder' : 'file',
		}
	}

	async collectUploadResults(files: Express.Multer.File[], targetPath?: string): Promise<FileManagerUploadResult[]> {
		const { sanitized } = this.resolveAbsolutePath(targetPath)
		const results: FileManagerUploadResult[] = []

		for (const file of files) {
			const relative = sanitized ? `${sanitized}/${file.filename}` : file.filename
			const item = await this.getItem(relative, false)
			results.push({
				...item,
				originalName: file.originalname,
			})
		}

		return results
	}

	getUploadDestination(relativePath?: string | null): string {
		const { absolute } = this.resolveAbsolutePath(relativePath)
		storageConfig.ensureDirectoryExists(absolute)
		return absolute
	}

	getAllowedMimeTypes(): string[] {
		return this.config.allowedMimeTypes
	}

	getMaxFileSizeBytes(): number {
		return this.config.maxUploadFileSizeMB * 1024 * 1024
	}
}


/**
 * @module File Utilities
 * @description Utility functions for file operations
 */

import * as fs from 'fs'
import * as path from 'path'

/**
 * File utility class for handling file operations
 */
export class FileUtils {
	/**
	 * Get storage root path - use process.cwd() which now points to apps/api with symlink
	 * 
	 * @returns Root directory path
	 */
	static getStorageRootPath(): string {
		return process.cwd()
	}

	/**
	 * Move temp file to permanent location
	 * 
	 * @param tempPath - Temporary file path (@temp/filename)
	 * @param entityId - Entity ID for organizing files (optional)
	 * @param type - File type (images, documents, videos)
	 * @param category - File category (banners, users, etc.)
	 * @returns Permanent file path
	 */
	static async moveTempFile(
		tempPath: string,
		entityId?: number | string | bigint,
		type: string = 'images',
		category: string = 'banners'
	): Promise<string> {
		if (typeof tempPath !== 'string' || !tempPath.startsWith('@temp/')) {
			throw new Error(`moveTempFile: tempPath must be a valid temp path string`)
		}

		const filename = tempPath.replace('@temp/', '')
		const rootDir = this.getStorageRootPath()
		
		// Convert entityId to string for directory name
		let entityIdStr = 'temp'
		if (entityId !== undefined && entityId !== null) {
			if (typeof entityId === 'number' || typeof entityId === 'bigint') {
				entityIdStr = String(entityId)
			} else if (typeof entityId === 'string') {
				entityIdStr = entityId
			} else {
				// Handle object types (e.g., Prisma BigInt)
				const idValue = (entityId as any)?.toString?.() || String(entityId)
				entityIdStr = idValue !== '[object Object]' ? idValue : 'temp'
			}
		}

		const tempDir = path.join(rootDir, 'storage', 'temp')
		const permanentDir = path.join(rootDir, 'storage', 'uploads', 'modules', category, entityIdStr)
		const sourcePath = path.join(tempDir, filename)
		const destinationPath = path.join(permanentDir, filename)

		try {
			// Create permanent directory if it doesn't exist
			if (!fs.existsSync(permanentDir)) {
				fs.mkdirSync(permanentDir, { recursive: true })
			}

			// Check if temp file exists
			if (!fs.existsSync(sourcePath)) {
				const tempFiles = fs.existsSync(tempDir) ? fs.readdirSync(tempDir) : []
				const similarFiles = tempFiles.filter(file => file.includes(filename.split('_')[0]))
				
				if (similarFiles.length > 0) {
					const actualSourcePath = path.join(tempDir, similarFiles[0])
					const actualDestinationPath = path.join(permanentDir, similarFiles[0])
					fs.renameSync(actualSourcePath, actualDestinationPath)
					return `/storage/uploads/${type}/${category}/${entityIdStr}/${similarFiles[0]}`
				}

				throw new Error(`Temp file not found: ${sourcePath}`)
			}

			// Move file from temp to permanent location
			fs.renameSync(sourcePath, destinationPath)

			return `/storage/uploads/modules/${category}/${entityIdStr}/${filename}`

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			throw new Error(`Failed to move temp file: ${tempPath}. ${errorMessage}`)
		}
	}

	/**
	 * Delete file from storage
	 * 
	 * @param filePath - File path to delete
	 */
	static async deleteFile(filePath: string): Promise<void> {
		try {
			if (typeof filePath !== 'string') {
				return
			}

			// Skip if it's a URL or temp path
			if (filePath.startsWith('http') || filePath.startsWith('@temp/')) {
				return
			}

			const relativePath = this.normalizeStoragePath(filePath)
			if (!relativePath) {
				return
			}

			const rootDir = this.getStorageRootPath()
			const absolutePath = path.join(rootDir, relativePath)

			if (fs.existsSync(absolutePath)) {
				fs.unlinkSync(absolutePath)
			}
		} catch (error) {
			// Don't throw error for file deletion failures
		}
	}

	/**
	 * Delete directory from storage
	 * 
	 * @param dirPath - Directory path to delete
	 */
	static async deleteDirectory(dirPath: string): Promise<void> {
		try {
			if (dirPath.startsWith('http') || dirPath.startsWith('@temp/')) {
				return
			}

			const relativePath = this.normalizeStoragePath(dirPath)
			if (!relativePath) {
				return
			}

			const rootDir = this.getStorageRootPath()
			const absolutePath = path.join(rootDir, relativePath)

			if (fs.existsSync(absolutePath)) {
				fs.rmSync(absolutePath, { recursive: true, force: true })
			}
		} catch (error) {
			// Don't throw error for directory deletion failures
		}
	}

	/**
	 * Process temp uploads - move temp files to permanent location
	 * 
	 * @param data - Data that may contain temp paths
	 * @param id - ID for organizing files
	 * @param fileFields - Fields that can contain single file paths (string)
	 * @param arrayFields - Fields that can contain array of file paths (string[])
	 * @param type - File type (images, documents, videos)
	 * @param category - File category (banners, users, etc.)
	 * @param existingData - Existing data for comparison
	 * @returns Processed data with permanent paths
	 */
	static async processTempUploads(
		data: any,
		id?: number,
		fileFields: string[] = ['image', 'mobile', 'youtube', 'video', 'file'],
		arrayFields: string[] = [],
		type: string = 'images',
		category: string = 'banners',
		existingData?: any
	): Promise<any> {
		const processedData = { ...data }

		// Process single file fields
		for (const field of fileFields) {
			let newValue = processedData[field]
			let oldValue = existingData?.[field]

			// Handle object format {src, alt} - extract src for newValue
			if (newValue && typeof newValue === 'object' && !Array.isArray(newValue) && 'src' in newValue) {
				newValue = typeof newValue.src === 'string' ? newValue.src : null
				processedData[field] = newValue
			}

			// Handle object format {src, alt} - extract src for oldValue
			if (oldValue && typeof oldValue === 'object' && !Array.isArray(oldValue) && 'src' in oldValue) {
				oldValue = typeof oldValue.src === 'string' ? oldValue.src : null
			}

			// Handle temp uploads
			if (newValue && typeof newValue === 'string' && newValue.startsWith('@temp/')) {
				const permanentPath = await this.moveTempFile(newValue, id, type, category)
				processedData[field] = permanentPath
			}

			// Handle file deletion (null or empty string)
			if ((newValue === null || newValue === '') && oldValue && typeof oldValue === 'string' && !oldValue.startsWith('@temp/')) {
				await this.deleteFile(oldValue)
				processedData[field] = null
			}

			// Handle file replacement (new file replaces old file)
			if (newValue && typeof newValue === 'string' && newValue !== oldValue && oldValue && typeof oldValue === 'string' && !oldValue.startsWith('@temp/') && !newValue.startsWith('@temp/')) {
				await this.deleteFile(oldValue)
			}
		}

		// Process array fields (like gallery)
		for (const field of arrayFields) {
			const newValue = processedData[field]
			const oldValue = existingData?.[field]

			if (Array.isArray(newValue)) {
				const processedArray: any[] = []

				for (const item of newValue) {
					if (typeof item === 'string') {
						if (item.startsWith('@temp/')) {
							const permanentPath = await this.moveTempFile(item, id, type, category)
							processedArray.push(permanentPath)
						} else if (item.trim().length > 0) {
							processedArray.push(item)
						}
					} else if (item && typeof item === 'object' && 'src' in item) {
						let srcValue = typeof item.src === 'string' ? item.src : null
						const altValue = (item as any).alt ?? null

						if (srcValue && srcValue.startsWith('@temp/')) {
							srcValue = await this.moveTempFile(srcValue, id, type, category)
						}

						if (srcValue && srcValue.trim().length > 0) {
							processedArray.push({
								src: srcValue,
								alt: altValue,
							})
						}
					}
				}

				processedData[field] = processedArray.length > 0 ? processedArray : null
			}

			if ((newValue === null || (Array.isArray(newValue) && newValue.length === 0)) &&
				oldValue && Array.isArray(oldValue)) {
				for (const oldItem of oldValue) {
					let oldPath: string | null = null

					if (typeof oldItem === 'string') {
						oldPath = oldItem
					} else if (oldItem && typeof oldItem === 'object' && 'src' in oldItem) {
						oldPath = typeof oldItem.src === 'string' ? oldItem.src : null
					}

					if (oldPath && !oldPath.startsWith('@temp/') && !oldPath.startsWith('http')) {
						await this.deleteFile(oldPath)
					}
				}
				processedData[field] = null
			}
		}

		return processedData
	}

	private static normalizeStoragePath(filePath: string): string | null {
		if (!filePath) {
			return null
		}

		if (filePath.startsWith('/storage')) {
			return filePath.replace(/^\//, '')
		}

		if (filePath.startsWith('/')) {
			return filePath.replace(/^\//, '')
		}

		return filePath
	}
}

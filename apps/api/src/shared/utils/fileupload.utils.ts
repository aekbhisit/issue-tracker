/**
 * @module FileUpload Media Utilities
 * @description Shared utility functions for FileUpload component media objects (image, video, file)
 */

import { FileUploadMedia } from '../types/fileupload.types'
import * as fs from 'fs'
import * as path from 'path'
import { FileUtils } from './file.utils'

const normalizeString = (value: unknown): string | null => {
	if (value === null || value === undefined) {
		return null
	}
	if (typeof value !== 'string') {
		return null
	}
	const trimmed = value.trim()
	return trimmed.length > 0 ? trimmed : null
}

/**
 * Check if value is a FileUploadMedia object
 */
export const isFileUploadMedia = (value: unknown): value is FileUploadMedia => {
	return !!value && typeof value === 'object' && 'src' in (value as Record<string, unknown>)
}

/**
 * Parse FileUpload media value from various formats (string, object, JSON string, array [src, alt])
 */
export const parseFileUploadMedia = (value: unknown): FileUploadMedia | null => {
	if (value === null || value === undefined) {
		return null
	}

	// Handle array format [src, alt] - from FileUpload component
	if (Array.isArray(value) && value.length === 2) {
		const srcValue = typeof value[0] === 'string' ? value[0].trim() : null
		const altValue = typeof value[1] === 'string' ? value[1].trim() : null

		if (!srcValue || srcValue.length === 0) {
			return null
		}

		return {
			src: srcValue,
			alt: altValue && altValue.length > 0 ? altValue : null,
		}
	}

	if (typeof value === 'string') {
		const trimmed = value.trim()
		if (trimmed.length === 0) {
			return null
		}

		// Try to parse as JSON string
		if (trimmed.startsWith('{')) {
			try {
				const parsed = JSON.parse(trimmed) as Record<string, unknown>
				const src = normalizeString(parsed.src)
				const alt = normalizeString(parsed.alt)
				if (!src) {
					return null
				}
				return {
					src,
					alt: alt ?? null,
				}
			} catch {
				// fall through to treat as plain path
			}
		}

		return { src: trimmed, alt: null }
	}

	if (isFileUploadMedia(value)) {
		const record = value as unknown as Record<string, unknown>
		const src = normalizeString(record.src)
		const alt = normalizeString(record.alt)
		if (!src) {
			return null
		}
		return {
			src,
			alt: alt ?? null,
		}
	}

	return null
}

/**
 * Sanitize FileUpload media value (alias for parseFileUploadMedia for consistency)
 */
export const sanitizeFileUploadMedia = (
	value: FileUploadMedia | string | [string, string] | null | undefined,
): FileUploadMedia | null => {
	return parseFileUploadMedia(value ?? null)
}

/**
 * Extract src from FileUpload media value
 */
export const extractFileUploadMediaSrc = (value: unknown): string | null => {
	const parsed = parseFileUploadMedia(value)
	return parsed?.src ?? null
}

/**
 * Merge FileUpload media with new src while preserving alt
 * Supports array format [src, alt], object format {src, alt}, or string
 */
export const mergeFileUploadMediaWithSrc = (
	src: string | null | undefined | [string, string] | { src?: string; alt?: string },
	base: FileUploadMedia | null | undefined,
): FileUploadMedia | null => {
	// Handle array format [src, alt]
	if (Array.isArray(src) && src.length === 2) {
		const srcValue = typeof src[0] === 'string' ? src[0].trim() : null
		const altValue = typeof src[1] === 'string' ? src[1].trim() : null
		if (!srcValue || srcValue.length === 0) {
			return null
		}
		return {
			src: srcValue,
			alt: altValue && altValue.length > 0 ? altValue : null,
		}
	}

	// Handle object format {src, alt}
	let sanitizedSrc: string | null = null
	let newAlt: string | null | undefined = undefined

	if (typeof src === 'string') {
		sanitizedSrc = src.trim()
	} else if (src && typeof src === 'object' && 'src' in src) {
		sanitizedSrc = typeof src.src === 'string' ? src.src.trim() : null
		newAlt = typeof src.alt === 'string' ? src.alt.trim() : (src.alt === null ? null : undefined)
	}

	if (!sanitizedSrc || sanitizedSrc.length === 0) {
		return null
	}

	// Use new alt if provided, otherwise preserve base alt
	const finalAlt = newAlt !== undefined ? newAlt : (base?.alt ?? null)

	return {
		src: sanitizedSrc,
		alt: finalAlt,
	}
}

/**
 * Serialize FileUpload media value to JSON string for database storage
 */
export const serializeFileUploadMedia = (value: FileUploadMedia | null): string | null => {
	if (!value) {
		return null
	}
	return JSON.stringify(value)
}

const normalizeStorageRelativePath = (filePath: string): string | null => {
	if (typeof filePath !== 'string' || filePath.length === 0) {
		return null
	}
	if (filePath.startsWith('http') || filePath.startsWith('@temp/')) {
		return null
	}
	const trimmed = filePath.startsWith('/') ? filePath.replace(/^\/+/, '') : filePath
	return trimmed.length > 0 ? trimmed : null
}

/**
 * Duplicate an existing file within storage and write to a new path
 *
 * @param sourcePath - Existing storage path (e.g. /storage/uploads/images/banners/1/file.jpg)
 * @param targetPath - New storage path to copy to
 * @returns boolean indicating success/failure
 */
export const duplicateFileUploadPath = async (sourcePath: string, targetPath: string): Promise<boolean> => {
	try {
		const sourceRelative = normalizeStorageRelativePath(sourcePath)
		const targetRelative = normalizeStorageRelativePath(targetPath)

		if (!sourceRelative || !targetRelative) {
			return false
		}

		const rootDir = FileUtils.getStorageRootPath()
		const absoluteSource = path.join(rootDir, sourceRelative)
		const absoluteTarget = path.join(rootDir, targetRelative)

		if (!fs.existsSync(absoluteSource)) {
			return false
		}

		const targetDir = path.dirname(absoluteTarget)
		if (!fs.existsSync(targetDir)) {
			fs.mkdirSync(targetDir, { recursive: true })
		}

		fs.copyFileSync(absoluteSource, absoluteTarget)
		return true
	} catch (error) {
		console.error('Failed to duplicate file path', error)
		return false
	}
}


/**
 * @module FileUpload Media Types
 * @description Shared type definitions for FileUpload component media objects (image, video, file)
 */

/**
 * FileUpload media interface used across all modules
 */
export interface FileUploadMedia {
	src: string | null
	alt?: string | null
}


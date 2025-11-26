import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import multer from 'multer'

import { FileManagerService } from './file_manager.service'
import { sendError, sendSuccess } from '../../shared/utils/response.util'

export class FileManagerController {
	private readonly service = new FileManagerService()

	list = async (req: Request, res: Response) => {
		try {
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return sendError(res, 'Invalid request', 422, errors.array())
			}

			const { path: relativePath, search } = req.query
			const data = await this.service.list(relativePath as string | undefined, search as string | undefined)
			return sendSuccess(res, data)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to list directory'
			return sendError(res, message, 500)
		}
	}

	uploadMiddleware = () => {
		const storage = multer.diskStorage({
			destination: (req, _file, cb) => {
				try {
					const target = this.service.getUploadDestination(req.query.path as string | undefined)
					cb(null, target)
				} catch (error) {
					cb(error as Error, '')
				}
			},
			filename: (_req, file, cb) => {
				const timestamp = Date.now()
				const sanitizedOriginal = file.originalname.replace(/[\r\n]+/g, '').replace(/[\\/]+/g, '_')
				const extension = sanitizedOriginal.includes('.') ? `.${sanitizedOriginal.split('.').pop()}` : ''
				const base = sanitizedOriginal.replace(/\.[^/.]+$/, '')
				cb(null, `${base}_${timestamp}${extension}`)
			},
		})

		return multer({
			storage,
			limits: {
				fileSize: this.service.getMaxFileSizeBytes(),
			},
			fileFilter: (_req, file, cb) => {
				if (!file.mimetype) {
					return cb(new Error('Unknown file type'))
				}

				if (!this.service.getAllowedMimeTypes().includes(file.mimetype)) {
					return cb(new Error('File type not allowed'))
				}

				cb(null, true)
			},
		})
	}

	upload = async (req: Request, res: Response) => {
		try {
			const files = Array.isArray(req.files)
				? req.files as Express.Multer.File[]
				: []

			if (!files.length) {
				return sendError(res, 'No files uploaded', 400)
			}

			const results = await this.service.collectUploadResults(files, req.query.path as string | undefined)
			return sendSuccess(res, { items: results }, 201, 'Uploaded')
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Upload failed'
			return sendError(res, message, 500)
		}
	}

	createFolder = async (req: Request, res: Response) => {
		try {
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return sendError(res, 'Invalid request', 422, errors.array())
			}

			const { path: relativePath, name } = req.body
			const item = await this.service.createFolder(relativePath, name)
			return sendSuccess(res, item, 201, 'Folder created')
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to create folder'
			return sendError(res, message, 400)
		}
	}

	rename = async (req: Request, res: Response) => {
		try {
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return sendError(res, 'Invalid request', 422, errors.array())
			}

			const { path: relativePath, newName } = req.body
			const result = await this.service.rename(relativePath, newName)
			return sendSuccess(res, result, 200, 'Renamed successfully')
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to rename target'
			return sendError(res, message, 400)
		}
	}

	delete = async (req: Request, res: Response) => {
		try {
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return sendError(res, 'Invalid request', 422, errors.array())
			}

			const { path: relativePath } = req.body
			const result = await this.service.delete(relativePath)
			return sendSuccess(res, result, 200, 'Deleted successfully')
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to delete target'
			return sendError(res, message, 400)
		}
	}
}


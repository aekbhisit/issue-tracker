import i18next from 'i18next'
import { apiClient } from '@/lib/api/client'
import type { FileManagerItem, FileManagerResponse } from './types'

export interface ListParams {
	path?: string
	search?: string
}

export class FileManagerApiService {
	static async list(params: ListParams = {}): Promise<FileManagerResponse> {
		try {
			const response = await apiClient.get('/file-manager', { params })
			return response.data.data
		} catch (error: any) {
			const message = error?.response?.data?.message ?? i18next.t('admin:fileManager.notifications.loadError')
			throw new Error(message)
		}
	}

	static async createFolder(path: string | undefined, name: string): Promise<FileManagerItem> {
		try {
			const response = await apiClient.post('/file-manager/folder', { path, name })
			return response.data.data
		} catch (error: any) {
			const message = error?.response?.data?.message ?? i18next.t('admin:fileManager.notifications.createError')
			throw new Error(message)
		}
	}

	static async rename(path: string, newName: string) {
		try {
			const response = await apiClient.patch('/file-manager/rename', { path, newName })
			return response.data.data
		} catch (error: any) {
			const message = error?.response?.data?.message ?? i18next.t('admin:fileManager.notifications.renameError')
			throw new Error(message)
		}
	}

	static async remove(path: string) {
		try {
			const response = await apiClient.delete('/file-manager', { data: { path } })
			return response.data.data
		} catch (error: any) {
			const message = error?.response?.data?.message ?? i18next.t('admin:fileManager.notifications.deleteError')
			throw new Error(message)
		}
	}

	static async upload(path: string | undefined, files: File[]): Promise<FileManagerItem[]> {
		const formData = new FormData()
		files.forEach((file) => {
			formData.append('files', file)
		})

		try {
			const response = await apiClient.post('/file-manager/upload', formData, {
				params: path ? { path } : undefined,
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			})
			return response.data.data.items ?? []
		} catch (error: any) {
			const message = error?.response?.data?.message ?? i18next.t('admin:fileManager.notifications.uploadError')
			throw new Error(message)
		}
	}
}


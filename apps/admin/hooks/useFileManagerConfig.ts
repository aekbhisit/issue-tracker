"use client"

import { useEffect, useState } from 'react'
import type { FileManagerConfig } from '@/app/admin/file-manager/types'

const DEFAULT_CONFIG: FileManagerConfig = {
	requireAdmin: true,
	rootDirectory: 'uploads',
	previewBasePath: '/storage/uploads',
	maxUploadFileSizeMB: 50,
	allowedMimeTypes: [
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
	gridHeight: 500,
	features: {
		upload: true,
		rename: true,
		delete: true,
		folders: true,
		search: true,
		preview: true,
		multiSelect: true,
	},
}

let cachedConfig: FileManagerConfig | null = null
let pendingRequest: Promise<FileManagerConfig> | null = null

async function fetchFileManagerConfig(): Promise<FileManagerConfig> {
	const response = await fetch('/config/filemanager.json', { cache: 'force-cache' })
	if (!response.ok) {
		throw new Error(`Failed to load file manager config: ${response.status}`)
	}
	const data = await response.json()
	return {
		requireAdmin: data?.requireAdmin ?? DEFAULT_CONFIG.requireAdmin,
		rootDirectory: data?.rootDirectory ?? DEFAULT_CONFIG.rootDirectory,
		previewBasePath: data?.previewBasePath ?? DEFAULT_CONFIG.previewBasePath,
		maxUploadFileSizeMB: data?.maxUploadFileSizeMB ?? DEFAULT_CONFIG.maxUploadFileSizeMB,
		allowedMimeTypes: Array.isArray(data?.allowedMimeTypes) && data.allowedMimeTypes.length > 0
			? data.allowedMimeTypes
			: DEFAULT_CONFIG.allowedMimeTypes,
		gridHeight: typeof data?.gridHeight === 'number' ? data.gridHeight : DEFAULT_CONFIG.gridHeight,
		features: {
			upload: data?.features?.upload ?? DEFAULT_CONFIG.features?.upload ?? true,
			rename: data?.features?.rename ?? DEFAULT_CONFIG.features?.rename ?? true,
			delete: data?.features?.delete ?? DEFAULT_CONFIG.features?.delete ?? true,
			folders: data?.features?.folders ?? DEFAULT_CONFIG.features?.folders ?? true,
			search: data?.features?.search ?? DEFAULT_CONFIG.features?.search ?? true,
			preview: data?.features?.preview ?? DEFAULT_CONFIG.features?.preview ?? true,
			multiSelect: data?.features?.multiSelect ?? DEFAULT_CONFIG.features?.multiSelect ?? true,
		},
	}
}

export function useFileManagerConfig() {
	const [config, setConfig] = useState<FileManagerConfig>(cachedConfig ?? DEFAULT_CONFIG)
	const [isLoading, setIsLoading] = useState(!cachedConfig)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		if (cachedConfig) {
			setIsLoading(false)
			return
		}

		if (!pendingRequest) {
			pendingRequest = fetchFileManagerConfig()
				.then((data) => {
					cachedConfig = data
					return cachedConfig
				})
				.catch((err) => {
					cachedConfig = DEFAULT_CONFIG
					throw err
				})
		}

		pendingRequest
			.then((data) => {
				setConfig(data)
				setIsLoading(false)
			})
			.catch((err) => {
				setConfig(DEFAULT_CONFIG)
				setError(err instanceof Error ? err : new Error('Failed to load config'))
				setIsLoading(false)
			})
	}, [])

	return { config, isLoading, error }
}


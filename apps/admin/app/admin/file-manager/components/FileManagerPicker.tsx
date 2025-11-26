"use client"

import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/modal'
import type { FileMetadataPayload } from '../types'
import { FileManagerBrowser } from './FileManagerBrowser'

interface FileManagerPickerProps {
	isOpen: boolean
	onClose: () => void
	onSelect: (payload: FileMetadataPayload) => void
	title?: string
}

export function FileManagerPicker({ isOpen, onClose, onSelect, title }: FileManagerPickerProps) {
	const { t } = useTranslation()
	const heading = title ?? t('admin.fileManager.picker.title')

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			showBackdrop={false}
			showCloseButton={false}
			className="bg-transparent shadow-none"
			contentClassName="w-[80vw] h-[80vh]"
		>
			<div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-950">
				<header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
					<div>
						<h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{heading}</h2>
						<p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.fileManager.picker.description')}</p>
					</div>
					<button onClick={onClose} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
						{t('admin.fileManager.picker.close')}
					</button>
				</header>
				<div className="flex-1 overflow-hidden px-6 py-6">
					<FileManagerBrowser
						mode="select"
						onSelect={(payload) => {
							onSelect(payload)
							onClose()
						}}
					/>
				</div>
			</div>
		</Modal>
	)
}


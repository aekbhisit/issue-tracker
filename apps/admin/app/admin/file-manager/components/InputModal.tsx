"use client"

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/modal'

interface InputModalProps {
	isOpen: boolean
	title: string
	description?: string
	placeholder?: string
	initialValue?: string
	confirmText?: string
	cancelText?: string
	onConfirm: (value: string) => void
	onCancel: () => void
}

export function InputModal({
	isOpen,
	title,
	description,
	placeholder,
	initialValue = '',
	confirmText,
	cancelText,
	onConfirm,
	onCancel,
}: InputModalProps) {
	const { t } = useTranslation()
	const [value, setValue] = useState(initialValue)

	useEffect(() => {
		if (isOpen) {
			setValue(initialValue)
		}
	}, [isOpen, initialValue])

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault()
		const trimmed = value.trim()
		if (!trimmed) {
			return
		}
		onConfirm(trimmed)
	}

	const confirmLabel = confirmText ?? t('admin.fileManager.inputModal.confirm')
	const cancelLabel = cancelText ?? t('admin.fileManager.inputModal.cancel')

	return (
		<Modal isOpen={isOpen} onClose={onCancel} className="max-w-lg p-6">
			<form className="space-y-6" onSubmit={handleSubmit}>
				<div>
					<h2 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h2>
					{description && (
						<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
					)}
				</div>
				<div>
					<input
						type="text"
						value={value}
						onChange={(event) => setValue(event.target.value)}
						placeholder={placeholder}
						className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
						autoFocus
					/>
				</div>
				<div className="flex items-center justify-end gap-3">
					<button
						type="button"
						onClick={onCancel}
						className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
					>
						{cancelLabel}
					</button>
					<button
						type="submit"
						className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
					>
						{confirmLabel}
					</button>
				</div>
			</form>
		</Modal>
	)
}


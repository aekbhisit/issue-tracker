"use client"

import { useCallback, useMemo, useRef, useState } from 'react'

import { FileManagerPicker } from '@/app/admin/file-manager/components'
import type { FileMetadataPayload } from '@/app/admin/file-manager/types'

export function useFileManagerPicker() {
	const [isOpen, setIsOpen] = useState(false)
	const resolverRef = useRef<((value: FileMetadataPayload | null) => void) | null>(null)

	const handleClose = useCallback(() => {
		setIsOpen(false)
		resolverRef.current?.(null)
		resolverRef.current = null
	}, [])

	const handleSelect = useCallback((payload: FileMetadataPayload) => {
		setIsOpen(false)
		resolverRef.current?.(payload)
		resolverRef.current = null
	}, [])

	const openPicker = useCallback(() => {
		setIsOpen(true)
		return new Promise<FileMetadataPayload | null>((resolve) => {
			resolverRef.current = resolve
		})
	}, [])

	const pickerElement = useMemo(() => (
		<FileManagerPicker isOpen={isOpen} onClose={handleClose} onSelect={handleSelect} />
	), [handleClose, handleSelect, isOpen])

	return {
		openPicker,
		picker: pickerElement,
		isOpen,
	}
}


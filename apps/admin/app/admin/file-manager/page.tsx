"use client"

import { useEffect, useState } from "react"
import { useTranslation } from 'react-i18next'
import { useRouter } from "next/navigation"
import { checkPageAccess } from "@/lib/utils/permission.util"
import { useNotification } from "@/hooks/useNotification"
import { FileManagerBrowser } from './components'

export default function FileManagerPage() {
	const router = useRouter()
	const { t } = useTranslation()
	const notification = useNotification()
	const { showError } = notification
	const [hasPermission, setHasPermission] = useState<boolean | null>(null)

	// Check page permission
	useEffect(() => {
		checkPageAccess(
			{ module: "file-manager", action: "get_data" },
			(denied) => {
				if (denied) {
					showError({
						message: t("common.errors.noPermission") || "You do not have permission to access this page",
					})
					// NOTE: With basePath='/admin', Next.js router.push automatically prepends basePath
					router.push("/dashboard")
				}
			}
		).then(setHasPermission)
	}, [router, showError, t])

	// Prevent rendering if permission check is not complete or denied
	if (hasPermission === null) {
		return null
	}

	if (!hasPermission) {
		return null
	}

	return (
		<div className="space-y-6">
			<FileManagerBrowser mode="manage" />
		</div>
	)
}


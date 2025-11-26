"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslation } from "react-i18next"

import { adminMenuApiService } from "../api"
import { AdminMenu } from "../types"
import { AdminMenuForm } from "../components/AdminMenuForm"
import { logger } from "@workspace/utils"
import { PageLoading } from "@/components/ui/loading"
import { useRouter } from "next/navigation"
import { checkPageAccess } from "@/lib/utils/permission.util"
import { useNotification } from "@/hooks/useNotification"

function AdminMenuFormContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { t } = useTranslation()
	const notification = useNotification()
	const { showError } = notification
	const [menu, setMenu] = useState<AdminMenu | null>(null)
	const [loading, setLoading] = useState(true)
	const [hasPermission, setHasPermission] = useState<boolean | null>(null)

	// Check page permission
	useEffect(() => {
		const id = searchParams?.get("id")
		const action = id ? "edit_data" : "add_data";
		checkPageAccess(
			{ module: "admin-menu", action },
			(denied) => {
				if (denied) {
					showError({
						message: t("common.errors.noPermission") || "You do not have permission to access this page",
					});
					router.push("/admin/admin-menu");
				}
			}
		).then(setHasPermission);
	}, [router, showError, t, searchParams]);

	useEffect(() => {
		const id = searchParams?.get("id")

		const loadMenu = async () => {
			if (id) {
				try {
					const response = await adminMenuApiService.getById(Number(id))
					setMenu(response.menu)
				} catch (error) {
					logger.error("Failed to load menu", error)
				} finally {
					setLoading(false)
				}
			} else {
				setLoading(false)
			}
		}

		loadMenu()
	}, [searchParams])

	// Prevent rendering if permission check is not complete or denied
	if (hasPermission === null) {
		return <PageLoading isVisible message={t("common.message.loading")} />
	}

	if (!hasPermission) {
		return null
	}

	if (loading) {
		return <PageLoading isVisible message={t("common.message.loading")} />
	}

	return <AdminMenuForm initialMenu={menu} isEditMode={Boolean(menu)} />
}

export default function AdminMenuFormPage() {
	const { t } = useTranslation()
	return (
		<Suspense fallback={<PageLoading isVisible message={t("common.message.loading")} />}>
			<AdminMenuFormContent />
		</Suspense>
	)
}


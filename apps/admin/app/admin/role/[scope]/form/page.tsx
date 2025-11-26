"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { useTranslation } from "react-i18next"

import { PageLoading } from "@/components/ui/loading"
import { logger } from "@workspace/utils"
import { useRouter } from "next/navigation"
import { checkPageAccess } from "@/lib/utils/permission.util"
import { useNotification } from "@/hooks/useNotification"

import { RoleApiService, mapRoleFromApi } from "../api"
import { Role, PermissionSummarySet } from "../types"
import { RoleForm } from "../components"

function RoleFormContentInternal() {
	const router = useRouter()
	const { scope } = useParams<{ scope: string }>()
	const resolvedScope = (scope ?? "admin").toLowerCase()
	const searchParams = useSearchParams()
	const { t } = useTranslation()
	const notification = useNotification()
	const { showError } = notification

	const [role, setRole] = useState<Role | null>(null)
	const [permissionSets, setPermissionSets] = useState<PermissionSummarySet[]>([])
	const [loading, setLoading] = useState(true)
	const [hasPermission, setHasPermission] = useState<boolean | null>(null)

	const idParam = searchParams?.get("id")
	const roleId = idParam ? parseInt(idParam, 10) : null

	// Check page permission
	useEffect(() => {
		const action = roleId ? "edit_data" : "add_data";
		checkPageAccess(
			{ module: "role", action, type: resolvedScope },
			(denied) => {
				if (denied) {
					showError({
						message: t("common.errors.noPermission") || "You do not have permission to access this page",
					});
					router.push(`/admin/role/${resolvedScope}`);
				}
			}
		).then(setHasPermission);
	}, [router, showError, t, resolvedScope, roleId]);

	useEffect(() => {
		let mounted = true

		const loadRole = async () => {
			if (!roleId) {
				setRole(null)
				return
			}
			try {
				const response = await RoleApiService.getRole(resolvedScope, roleId)
				if (!mounted) return
				setRole(mapRoleFromApi(response.data))
			} catch (error) {
				logger.error("Failed to load role", error)
			}
		}

		loadRole()

		return () => {
			mounted = false
		}
	}, [resolvedScope, roleId])

	useEffect(() => {
		let mounted = true
		const loadPermissions = async () => {
			setLoading(true)
			try {
				const sets = await RoleApiService.getPermissions(resolvedScope)
				if (!mounted) return
				setPermissionSets(sets ?? [])
			} catch (error) {
				logger.error("Failed to load permissions", error)
			} finally {
				if (mounted) {
					setLoading(false)
				}
			}
		}

		loadPermissions()

		return () => {
			mounted = false
		}
	}, [resolvedScope])

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

	return (
		<RoleForm
			scope={resolvedScope}
			initialRole={role}
			permissionSets={permissionSets}
			isEditMode={Boolean(roleId)}
		/>
	)
}

export default function RoleFormPage() {
	const { t } = useTranslation()

	return (
		<Suspense fallback={<PageLoading isVisible message={t("common.message.loading")} />}>
			<RoleFormContentInternal />
		</Suspense>
	)
}



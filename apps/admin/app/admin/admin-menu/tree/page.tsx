"use client"

import { useCallback, useEffect, useState } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { useTranslation } from "react-i18next"

import { TablePageLayout, TableSection } from "@/components/tables/TablePageLayout"
import Button from "@/components/ui/button/Button"
import { useNotification } from "@/hooks/useNotification"
import ToastContainer from "@/components/ui/notification/ToastContainer"
import { useLoading } from "@/context/LoadingContext"
import { useNavigationOverlay } from "@/hooks/useNavigationOverlay"
import DTLoading from "@/components/ui/loading/DTLoading"
import { logger } from "@workspace/utils"
import { useRouter } from "next/navigation"
import { checkPageAccess } from "@/lib/utils/permission.util"

import { adminMenuApiService } from "../api"
import { AdminMenuTreeResponse } from "../types"
import { TreeView } from "./components/TreeView"
import {
	buildFlatPayload,
	cloneTree,
	getNodeLocation,
	isDescendant,
	moveNode,
	normalizeTree,
	TreeNodeWithMeta,
} from "./utils"

export default function AdminMenuTreePage() {
	const router = useRouter()
	const { t } = useTranslation()
	const { showLoading, hideLoading } = useLoading()
	const { pushWithOverlay } = useNavigationOverlay()
	const notification = useNotification()
	const { toasts, showError, showSuccess, removeToast } = notification

	const [tree, setTree] = useState<TreeNodeWithMeta[]>([])
	const [originalTree, setOriginalTree] = useState<TreeNodeWithMeta[]>([])
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [hasChanges, setHasChanges] = useState(false)
	const [hasPermission, setHasPermission] = useState<boolean | null>(null)

	// Check page permission
	useEffect(() => {
		checkPageAccess(
			{ module: "admin-menu", action: "get_data" },
			(denied) => {
				if (denied) {
					showError({
						message: t("common.errors.noPermission") || "You do not have permission to access this page",
					});
					router.push("/admin/admin-menu");
				}
			}
		).then(setHasPermission);
	}, [router, showError, t]);

	const loadTree = useCallback(async () => {
		setLoading(true)
		try {
			showLoading(t("common.message.loading"))
			const response: AdminMenuTreeResponse = await adminMenuApiService.getTree()
			const normalized = normalizeTree(response.menu ?? [])
			setTree(normalized)
			setOriginalTree(cloneTree(normalized))
			setHasChanges(false)
		} catch (error) {
			logger.error("Failed to load admin menu tree", error)
			showError({
				message: (error as Error).message || t("admin.admin_menu.errors.load"),
			})
			setTree([])
			setOriginalTree([])
		} finally {
			hideLoading()
			setLoading(false)
		}
	}, [hideLoading, showError, showLoading, t])

	useEffect(() => {
		loadTree()
	}, [loadTree])

	const canDropNode = useCallback(
		(dragId: number, targetParentId: number | null, _targetIndex?: number) => {
			if (targetParentId === dragId) {
				return false
			}
			if (targetParentId !== null && isDescendant(tree, dragId, targetParentId)) {
				return false
			}
			return true
		},
		[tree],
	)

	const handleMove = useCallback(
		(dragId: number, targetParentId: number | null, targetIndex: number) => {
			let didChange = false
			let nextTreeState: TreeNodeWithMeta[] | null = null
			setTree((prevTree) => {
				if (!canDropNode(dragId, targetParentId)) {
					return prevTree
				}

				const location = getNodeLocation(prevTree, dragId)
				if (!location) {
					return prevTree
				}

				const sameParent = location.parentId === targetParentId
				let nextIndex = targetIndex

				if (sameParent && targetIndex > location.index) {
					nextIndex = targetIndex - 1
				}

				if (sameParent && nextIndex === location.index) {
					return prevTree
				}

				const nextTree = moveNode(prevTree, dragId, targetParentId, nextIndex)
				didChange = true
				nextTreeState = nextTree
				return nextTree
			})

			if (didChange && nextTreeState) {
				setHasChanges(true)
			}
		},
		[canDropNode],
	)

	const handleReset = useCallback(() => {
		setTree(cloneTree(originalTree))
		setHasChanges(false)
	}, [originalTree])

	const handleSave = useCallback(async () => {
		setSaving(true)
		try {
			showLoading(t("common.message.loading"))
			const payload = buildFlatPayload(tree)
			const response: AdminMenuTreeResponse = await adminMenuApiService.reorderTree(payload)
			const normalized = normalizeTree(response.menu ?? [])
			setTree(normalized)
			setOriginalTree(cloneTree(normalized))
			setHasChanges(false)
			showSuccess({ message: t("common.adminMenu.tree.saveSuccess") })
		} catch (error) {
			logger.error("Failed to save admin menu tree", error)
			showError({
				message: (error as Error).message || t("admin.admin_menu.errors.updateSequence"),
			})
		} finally {
			hideLoading()
			setSaving(false)
		}
	}, [hideLoading, showError, showLoading, showSuccess, t, tree])

	const handleBack = useCallback(() => {
		pushWithOverlay("/admin/admin-menu")
	}, [pushWithOverlay])

	// Prevent rendering if permission check is not complete or denied
	if (hasPermission === null) {
		return <DTLoading />
	}

	if (!hasPermission) {
		return null
	}

	return (
		<TablePageLayout>
			<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
							{t("common.adminMenu.tree.title")}
						</h2>
						<p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
							{t("common.adminMenu.tree.description")}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<Button variant="outline" onClick={handleBack}>
							{t("common.button.cancel")}
						</Button>
						<Button variant="outline" onClick={handleReset} disabled={!hasChanges || loading || saving}>
							{t("common.button.reset")}
						</Button>
						<Button onClick={handleSave} disabled={!hasChanges || saving || loading}>
							{saving ? t("common.message.loading") : t("common.button.save")}
						</Button>
					</div>
				</div>
			</div>
			<TableSection>
				<div className="mt-4 mb-4 ms-6 text-sm text-gray-600 dark:text-gray-300">
					{t("common.table.treeDragHint")}
				</div>
				{hasChanges && (
					<div className="mt-4 mb-4 ms-6 me-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/50 dark:bg-amber-900/20 dark:text-amber-200">
						{t("common.adminMenu.tree.unsavedChanges")}
					</div>
				)}
				<div className="rounded-lg border border-dashed border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
					{loading ? (
						<div className="py-12">
							<DTLoading />
						</div>
					) : tree.length === 0 ? (
						<div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
							{t("common.adminMenu.tree.empty")}
						</div>
					) : (
						<DndProvider backend={HTML5Backend}>
							<TreeView nodes={tree} onMove={handleMove} canDropNode={canDropNode} />
						</DndProvider>
					)}
				</div>
			</TableSection>
			<ToastContainer toasts={toasts} onRemoveToast={removeToast} />
		</TablePageLayout>
	)
}


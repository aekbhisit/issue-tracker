"use client"

import { useTranslation } from "react-i18next"
import type { ActivityLog } from "../types"

interface ActivityLogDetailModalProps {
	log: ActivityLog | null
	isOpen: boolean
	onClose: () => void
}

export function ActivityLogDetailModal({ log, isOpen, onClose }: ActivityLogDetailModalProps) {
	const { t } = useTranslation()

	if (!isOpen || !log) {
		return null
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800">
				<div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
						{t("admin.activityLog.detail.title") || "Activity Log Details"}
					</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
					>
						<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				<div className="p-6">
					<div className="grid grid-cols-2 gap-4 mb-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("admin.activityLog.detail.action") || "Action"}
							</label>
							<p className="mt-1 text-sm text-gray-900 dark:text-white">{log.action}</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("admin.activityLog.detail.model") || "Model"}
							</label>
							<p className="mt-1 text-sm text-gray-900 dark:text-white">{log.model}</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("admin.activityLog.detail.modelId") || "Model ID"}
							</label>
							<p className="mt-1 text-sm text-gray-900 dark:text-white">{log.modelId}</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("admin.activityLog.detail.user") || "User"}
							</label>
							<p className="mt-1 text-sm text-gray-900 dark:text-white">
								{log.user?.name || log.user?.username || log.user?.email || "System"}
							</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("admin.activityLog.detail.timestamp") || "Timestamp"}
							</label>
							<p className="mt-1 text-sm text-gray-900 dark:text-white">
								{log.createdAt.toLocaleString()}
							</p>
						</div>
						{log.ipAddress && (
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
									{t("admin.activityLog.detail.ipAddress") || "IP Address"}
								</label>
								<p className="mt-1 text-sm text-gray-900 dark:text-white">{log.ipAddress}</p>
							</div>
						)}
					</div>

					{log.action === "UPDATE" && log.changes && (
						<div className="mb-6">
							<h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
								{t("admin.activityLog.detail.changes") || "Changes"}
							</h4>
							<div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
								<pre className="overflow-x-auto text-xs text-gray-800 dark:text-gray-200">
									{JSON.stringify(log.changes, null, 2)}
								</pre>
							</div>
						</div>
					)}

					<div className="grid grid-cols-2 gap-4">
						{log.oldData && (
							<div>
								<h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
									{t("admin.activityLog.detail.oldData") || "Old Data"}
								</h4>
								<div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
									<pre className="overflow-x-auto text-xs text-gray-800 dark:text-gray-200 max-h-96">
										{JSON.stringify(log.oldData, null, 2)}
									</pre>
								</div>
							</div>
						)}
						{log.newData && (
							<div>
								<h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
									{t("admin.activityLog.detail.newData") || "New Data"}
								</h4>
								<div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
									<pre className="overflow-x-auto text-xs text-gray-800 dark:text-gray-200 max-h-96">
										{JSON.stringify(log.newData, null, 2)}
									</pre>
								</div>
							</div>
						)}
					</div>
				</div>
				<div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
					<button
						onClick={onClose}
						className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
					>
						{t("common.button.close") || "Close"}
					</button>
				</div>
			</div>
		</div>
	)
}


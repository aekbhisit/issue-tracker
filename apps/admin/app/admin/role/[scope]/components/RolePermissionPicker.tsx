"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import CheckboxInput from "@/components/form/inputs/CheckboxInput"

import { PermissionSummaryGroup, PermissionSummaryModule, PermissionSummarySet } from "../types"

interface RolePermissionPickerProps {
	scope: string
	permissionSets: PermissionSummarySet[]
	selectedPermissionIds: number[]
	onChange: (permissionIds: number[]) => void
	className?: string
}

export function RolePermissionPicker({
	scope,
	permissionSets,
	selectedPermissionIds,
	onChange,
	className,
}: RolePermissionPickerProps) {
	const { t } = useTranslation()

	const selectedSet = useMemo(() => new Set(selectedPermissionIds), [selectedPermissionIds])

	const allActionIds = useMemo(() => {
		const ids = new Set<number>()
		permissionSets.forEach((set) =>
			set.modules.forEach((module) => module.groups.forEach((group) => group.actionIds.forEach((id) => ids.add(id)))),
		)
		return Array.from(ids)
	}, [permissionSets])

	const allSelected = allActionIds.length > 0 && allActionIds.every((id) => selectedSet.has(id))

	const [openModules, setOpenModules] = useState<Record<string, boolean>>({})

	const handleGroupChange = (group: PermissionSummaryGroup, checked: boolean) => {
		const next = new Set(selectedPermissionIds)

		if (checked) {
			group.actionIds.forEach((id) => next.add(id))
		} else {
			group.actionIds.forEach((id) => next.delete(id))
		}

		onChange(Array.from(next).sort((a, b) => a - b))
	}

	const handleModuleChange = (module: PermissionSummaryModule, checked: boolean) => {
		const ids = module.groups.flatMap((group) => group.actionIds)
		const next = new Set(selectedPermissionIds)

		if (checked) {
			ids.forEach((id) => next.add(id))
		} else {
			ids.forEach((id) => next.delete(id))
		}

		onChange(Array.from(next).sort((a, b) => a - b))
	}

	const handleToggleAll = (checked: boolean) => {
		if (checked) {
			const combined = new Set([...selectedPermissionIds, ...allActionIds])
			onChange(Array.from(combined).sort((a, b) => a - b))
			return
		}
		onChange([])
	}

	const toggleModuleOpen = (moduleKey: string) => {
		setOpenModules((prev) => ({
			...prev,
			[moduleKey]: !(prev[moduleKey] ?? true),
		}))
	}

	const renderGroup = (group: PermissionSummaryGroup) => {
		const actionIds = group.actionIds
		const allSelected = actionIds.every((id) => selectedSet.has(id))

		return (
			<div
				key={group.key}
				className="flex items-center justify-between rounded border border-gray-200 dark:border-gray-700 px-3 py-2"
			>
				<div className="flex items-center gap-3">
					<CheckboxInput
						checked={allSelected}
						onChange={(checked) => handleGroupChange(group, checked)}
					/>
					<span className="text-sm text-gray-700 dark:text-gray-200">{group.label}</span>
				</div>
				<span className="text-xs text-gray-500 dark:text-gray-400">
					{group.actionIds.length} {t("admin.role.permissions.actions")}
				</span>
			</div>
		)
	}

	const renderModule = (module: PermissionSummaryModule) => {
		const moduleIds = module.groups.flatMap((group) => group.actionIds)
		const moduleSelected = moduleIds.length > 0 && moduleIds.every((id) => selectedSet.has(id))
		const isOpen = openModules[module.key] ?? true

		return (
			<div key={module.key} className="rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/50">
				<div className="flex items-center gap-3 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
					<CheckboxInput
						checked={moduleSelected}
						onChange={(checked) => handleModuleChange(module, checked)}
						className="flex items-center"
					/>
					<div className="flex flex-col">
						<span className="text-sm font-semibold text-gray-900 dark:text-white">{module.label}</span>
						<span className="text-xs text-gray-400">{t("admin.role.permissions.groupCount", { count: module.groups.length })}</span>
					</div>
					<button
						type="button"
						onClick={() => toggleModuleOpen(module.key)}
						className="ml-auto flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
						aria-label={
							isOpen
								? t("common.button.collapse")
								: t("common.button.expand")
						}
					>
						<span className={`transition-transform ${isOpen ? "rotate-90" : "rotate-0"}`}>▸</span>
					</button>
				</div>
				{isOpen && <div className="space-y-2 px-3 py-3">{module.groups.map(renderGroup)}</div>}
			</div>
		)
	}

	return (
		<div className={className}>
			<div className="flex items-center justify-between gap-3">
				<CheckboxInput
					checked={allSelected}
					onChange={(checked) => handleToggleAll(checked)}
					label={t("admin.role.permissions.selectAll")}
				/>
				<span className="text-sm text-gray-500 dark:text-gray-400">
					{t("admin.role.permissions.selectedCount", {
						count: selectedPermissionIds.length,
					})}
				</span>
			</div>
			<div className="mt-4 space-y-4">
				{permissionSets.length === 0 ? (
					<div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
						{t("admin.role.permissions.noPermissions")}
					</div>
				) : (
					permissionSets.map((set) => {
						const typeLabel =
							set.type ?? t("admin.role.permissions.defaultType")
						const typeActionIds = set.modules.flatMap((module) =>
							module.groups.flatMap((group) => group.actionIds),
						)
						const typeSelected =
							typeActionIds.length > 0 && typeActionIds.every((id) => selectedSet.has(id))

						return (
							<div
								key={set.type ?? "default"}
								className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
							>
								<TypeSection
									label={typeLabel}
									isSelected={typeSelected}
									moduleCount={set.modules.length}
									actionIds={typeActionIds}
									selectedPermissionIds={selectedPermissionIds}
									onChange={onChange}
									renderContent={() => (
										<div className="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-3">
									{set.modules.map((module) => renderModule(module))}
										</div>
									)}
								/>
							</div>
						)
					})
				)}
			</div>
			<p className="mt-4 text-xs text-gray-400">
				{t("admin.role.permissions.helper")}
			</p>
		</div>
	)
}

interface TypeSectionProps {
	label: string
	moduleCount: number
	isSelected: boolean
	actionIds: number[]
	selectedPermissionIds: number[]
	onChange: (permissionIds: number[]) => void
	renderContent: () => React.ReactNode
}

function TypeSection({
	label,
	moduleCount,
	isSelected,
	actionIds,
	selectedPermissionIds,
	onChange,
	renderContent,
}: TypeSectionProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(true)

	const handleToggle = (checked: boolean) => {
		const next = new Set(selectedPermissionIds)
		if (checked) {
			actionIds.forEach((id) => next.add(id))
		} else {
			actionIds.forEach((id) => next.delete(id))
		}
		onChange(Array.from(next).sort((a, b) => a - b))
	}

	return (
		<div className="w-full">
			<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
				<div className="flex items-center gap-3">
					<CheckboxInput
						checked={isSelected}
						onChange={handleToggle}
					/>
					<h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</h4>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-xs text-gray-400">
						{t("admin.role.permissions.moduleCount", {
							count: moduleCount,
						})}
					</span>
					<button
						type="button"
						onClick={() => setOpen((prev) => !prev)}
						className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
						aria-label={
							open
								? t("common.button.collapse")
								: t("common.button.expand")
						}
					>
						<span className={`transition-transform ${open ? "rotate-90" : "rotate-0"}`}>▸</span>
					</button>
				</div>
			</div>
			{open && renderContent()}
		</div>
	)
}



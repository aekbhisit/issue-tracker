"use client"

import { Fragment, useRef, type ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { useDrag, useDrop } from "react-dnd"

import { TreeNodeWithMeta } from "../utils"

const ITEM_TYPE = "ADMIN_MENU_NODE"
const INDENT_SIZE = 40

interface DragItem {
	id: number
}

type DropPlacement = "before" | "between" | "child" | "last"

interface TreeDropZoneProps {
	parentId: number | null
	index: number
	depth: number
	placement: DropPlacement
	onMove: (dragId: number, parentId: number | null, index: number) => void
	canDropNode: (dragId: number, parentId: number | null, index?: number) => boolean
}

const TreeDropZone = ({ parentId, index, depth, placement, onMove, canDropNode }: TreeDropZoneProps) => {
	const dropRef = useRef<HTMLDivElement | null>(null)
	const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>(() => ({
		accept: ITEM_TYPE,
		canDrop: (item) => canDropNode(item.id, parentId, index),
		drop: (item) => {
			onMove(item.id, parentId, index)
		},
		collect: (monitor) => ({
			isOver: monitor.isOver(),
			canDrop: monitor.canDrop(),
		}),
	}))

	drop(dropRef)

	const isChildPlacement = placement === "child"
	const baseHeight = isChildPlacement ? 8 : 6
	const readyHeight = isChildPlacement ? 14 : 10
	const hoverHeight = isChildPlacement ? 24 : 18
	const height = canDrop ? (isOver ? hoverHeight : readyHeight) : baseHeight

	const baseClasses =
		"my-1 w-full rounded border border-dashed border-transparent transition-all duration-150 ease-in-out"
	const activeClasses = canDrop ? " border-brand-300 bg-brand-50/50" : ""
	const hoverClasses = canDrop && isOver ? " border-brand-500 bg-brand-100 shadow-[0_0_0_3px_rgba(59,130,246,0.25)]" : ""

	return (
		<div style={{ paddingLeft: depth * INDENT_SIZE }}>
			<div
				ref={dropRef}
				data-parent-id={parentId ?? "root"}
				data-seq={index}
				data-placement={placement}
				className={`${baseClasses}${activeClasses}${hoverClasses}`}
				style={{ height }}
			/>
		</div>
	)
}

interface TreeNodeProps {
	node: TreeNodeWithMeta
	depth: number
	index: number
}

const TreeNode = ({ node, depth, index }: TreeNodeProps) => {
	const { t } = useTranslation()
	const dragRef = useRef<HTMLDivElement | null>(null)
	const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>(() => ({
		type: ITEM_TYPE,
		item: { id: node.id },
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	}))

	drag(dragRef)

	const translationName = node.translates?.find((translate) => translate?.name)?.name
	const displayName = translationName || node.module || node.path || t("common.message.untitled")
	const nodeBaseClasses =
		"flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm transition dark:border-gray-700 dark:bg-gray-800"
	const nodeDraggingClasses = isDragging ? " opacity-50" : ""
	const statusBaseClasses = "rounded-full px-2 py-0.5 text-xs font-medium"
	const statusActiveClasses = " bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
	const statusInactiveClasses = " bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
	const indent = depth * INDENT_SIZE
	const connectorLeft = indent - INDENT_SIZE / 2

	return (
		<div className="relative" style={{ paddingLeft: indent }}>
			{depth > 0 && (
				<>
					<span
						className="pointer-events-none absolute border-t border-gray-200 dark:border-gray-700"
						style={{
							left: connectorLeft,
							top: 40,
							width: INDENT_SIZE / 2,
							borderTopWidth: 3,
						}}
					/>
					<span
						className="pointer-events-none absolute border-l border-gray-200 dark:border-gray-700"
						style={{
							left: connectorLeft,
							top: index === 0 ? -23 : -70,
							bottom: 28,
							borderLeftWidth: 3,
						}}
					/>
				</>
			)}
			<div
				ref={dragRef}
				data-parent-id={node.parentId ?? "root"}
				data-seq={node.sequence}
				className={`${nodeBaseClasses}${nodeDraggingClasses}`}
			>
				<div className="flex flex-col gap-1">
					<span className="text-sm font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
					<div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
						<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
							#{node.sequence}
						</span>
						{node.path && <span className="truncate text-xs">{node.path}</span>}
						{node.module && (
							<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
								{node.module}
							</span>
						)}
						{node.type && (
							<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
								{node.type}
							</span>
						)}
					</div>
				</div>
				<span
					className={`${statusBaseClasses}${node.status ? statusActiveClasses : statusInactiveClasses}`}
				>
					{node.status ? t("common.table.status.active") : t("common.table.status.inactive")}
				</span>
			</div>
		</div>
	)
}

interface TreeListProps {
	nodes: TreeNodeWithMeta[]
	parentId: number | null
	depth: number
	onMove: (dragId: number, parentId: number | null, index: number) => void
	canDropNode: (dragId: number, parentId: number | null, index?: number) => boolean
}

function TreeList({ nodes, parentId, depth, onMove, canDropNode }: TreeListProps): ReactElement {
	const isRoot = depth === 0
	const containerClass = isRoot ? "space-y-1" : "space-y-1 pt-1"

	return (
		<div className={containerClass}>
			<TreeDropZone
				parentId={parentId}
				index={0}
				depth={depth}
				placement="before"
				onMove={onMove}
				canDropNode={canDropNode}
			/>
			{nodes.map((node, index) => (
				<Fragment key={node.id}>
					<TreeNode node={node} depth={depth} index={index} />
					{node.children && node.children.length > 0 ? (
						<TreeList
							nodes={node.children}
							parentId={node.id}
							depth={depth + 1}
							onMove={onMove}
							canDropNode={canDropNode}
						/>
					) : (
						<TreeDropZone
							parentId={node.id}
							index={0}
							depth={depth + 1}
							placement="child"
							onMove={onMove}
							canDropNode={canDropNode}
						/>
					)}
					{index < nodes.length - 1 && (
						<TreeDropZone
							parentId={parentId}
							index={index + 1}
							depth={depth}
							placement="between"
							onMove={onMove}
							canDropNode={canDropNode}
						/>
					)}
				</Fragment>
			))}
			<TreeDropZone
				parentId={parentId}
				index={nodes.length}
				depth={depth}
				placement="last"
				onMove={onMove}
				canDropNode={canDropNode}
			/>
		</div>
	)
}

interface TreeViewProps {
	nodes: TreeNodeWithMeta[]
	onMove: (dragId: number, parentId: number | null, index: number) => void
	canDropNode: (dragId: number, parentId: number | null, index?: number) => boolean
}

export function TreeView({ nodes, onMove, canDropNode }: TreeViewProps): ReactElement {
	return <TreeList nodes={nodes} parentId={null} depth={0} onMove={onMove} canDropNode={canDropNode} />
}


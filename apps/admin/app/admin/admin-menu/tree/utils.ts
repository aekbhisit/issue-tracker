"use client"

import type { AdminMenu } from "../types"
import type { FlatNodePosition, TreeNodeWithMeta as GenericTreeNodeWithMeta } from "@/lib/tree"

export type TreeNodeWithMeta = GenericTreeNodeWithMeta<AdminMenu>
export type { FlatNodePosition }

export {
	normalizeTree,
	cloneTree,
	isDescendant,
	moveNode,
	getNodeLocation,
	buildFlatPayload,
} from "@/lib/tree"


export interface FlatNodePosition {
	id: number
	parentId: number | null
	sequence: number
}

export type TreeNodeWithMeta<T extends { id: number }> = T & {
	parentId: number | null
	sequence: number
	children?: TreeNodeWithMeta<T>[]
}

type TreeEntityWithChildren<T extends { id: number }> = T & { children?: T[] }

export function normalizeTree<T extends { id: number }>(
	nodes: TreeEntityWithChildren<T>[],
	parentId: number | null = null,
): TreeNodeWithMeta<T>[] {
	return nodes.map((node, index) => ({
		...node,
		parentId,
		sequence: index + 1,
		children: node.children ? normalizeTree(node.children, node.id) : [],
	}))
}

export function cloneTree<T extends { id: number }>(nodes: TreeNodeWithMeta<T>[]): TreeNodeWithMeta<T>[] {
	return nodes.map((node) => ({
		...node,
		children: node.children ? cloneTree(node.children) : [],
	}))
}

export function flattenTree<T extends { id: number }>(nodes: TreeNodeWithMeta<T>[]): FlatNodePosition[] {
	const flat: FlatNodePosition[] = []
	const traverse = (currentNodes: TreeNodeWithMeta<T>[], parentId: number | null) => {
		currentNodes.forEach((node, index) => {
			const sequence = index + 1
			flat.push({ id: node.id, parentId, sequence })
			if (node.children && node.children.length > 0) {
				traverse(node.children, node.id)
			}
		})
	}
	traverse(nodes, null)
	return flat
}

export function findNode<T extends { id: number }>(
	nodes: TreeNodeWithMeta<T>[],
	id: number,
): TreeNodeWithMeta<T> | undefined {
	for (const node of nodes) {
		if (node.id === id) {
			return node
		}
		if (node.children) {
			const found = findNode(node.children, id)
			if (found) return found
		}
	}
	return undefined
}

export function isDescendant<T extends { id: number }>(tree: TreeNodeWithMeta<T>[], ancestorId: number, targetId: number): boolean {
	const ancestor = findNode(tree, ancestorId)
	if (!ancestor) return false

	const stack = [...(ancestor.children ?? [])]
	while (stack.length > 0) {
		const current = stack.pop()!
		if (current.id === targetId) {
			return true
		}
		if (current.children && current.children.length > 0) {
			stack.push(...current.children)
		}
	}

	return false
}

export function removeNodeFromTree<T extends { id: number }>(
	nodes: TreeNodeWithMeta<T>[],
	nodeId: number,
): { removed: TreeNodeWithMeta<T> | null; tree: TreeNodeWithMeta<T>[] } {
	let removedNode: TreeNodeWithMeta<T> | null = null

	const nextNodes: TreeNodeWithMeta<T>[] = nodes.reduce<TreeNodeWithMeta<T>[]>((acc, current) => {
		if (current.id === nodeId) {
			removedNode = current
			return acc
		}

		if (current.children && current.children.length > 0) {
			const result = removeNodeFromTree(current.children, nodeId)
			if (result.removed) {
				removedNode = result.removed
				acc.push({
					...current,
					children: result.tree,
				})
				return acc
			}
		}

		acc.push(current)
		return acc
	}, [])

	return { removed: removedNode, tree: nextNodes }
}

function recalcSequences<T extends { id: number }>(
	nodes: TreeNodeWithMeta<T>[],
	parentId: number | null,
): TreeNodeWithMeta<T>[] {
	return nodes.map((node, index) => {
		const sequence = index + 1
		return {
			...node,
			parentId,
			sequence,
			children: node.children ? recalcSequences(node.children, node.id) : [],
		}
	})
}

export function insertNodeIntoTree<T extends { id: number }>(
	nodes: TreeNodeWithMeta<T>[],
	parentId: number | null,
	index: number,
	node: TreeNodeWithMeta<T>,
): TreeNodeWithMeta<T>[] {
	if (parentId === null) {
		const nextNodes = [...nodes]
		const nextIndex = Math.max(0, Math.min(index, nextNodes.length))
		nextNodes.splice(nextIndex, 0, { ...node, parentId: null })
		return recalcSequences(nextNodes, null)
	}

	return recalcSequences(
		nodes.map((current) => {
			if (current.id === parentId) {
				const children = current.children ? [...current.children] : []
				const nextIndex = Math.max(0, Math.min(index, children.length))
				children.splice(nextIndex, 0, { ...node, parentId })
				return {
					...current,
					children: recalcSequences(children, parentId),
				}
			}

			if (current.children && current.children.length > 0) {
				return {
					...current,
					children: insertNodeIntoTree(current.children, parentId, index, node),
				}
			}

			return current
		}),
		null,
	)
}

export function moveNode<T extends { id: number }>(
	tree: TreeNodeWithMeta<T>[],
	nodeId: number,
	newParentId: number | null,
	index: number,
): TreeNodeWithMeta<T>[] {
	if (nodeId === newParentId) {
		return tree
	}

	const { removed, tree: withoutNode } = removeNodeFromTree(tree, nodeId)
	if (!removed) {
		return tree
	}

	const nextTree = insertNodeIntoTree(withoutNode, newParentId, index, { ...removed, children: removed.children ?? [] })
	return recalcSequences(nextTree, null)
}

export function getNodeLocation<T extends { id: number }>(
	nodes: TreeNodeWithMeta<T>[],
	nodeId: number,
	parentId: number | null = null,
): { parentId: number | null; index: number } | null {
	for (let index = 0; index < nodes.length; index += 1) {
		const current = nodes[index]
		if (current.id === nodeId) {
			return { parentId, index }
		}

		if (current.children && current.children.length > 0) {
			const childLocation = getNodeLocation(current.children, nodeId, current.id)
			if (childLocation) {
				return childLocation
			}
		}
	}

	return null
}

export function buildFlatPayload<T extends { id: number }>(nodes: TreeNodeWithMeta<T>[]): FlatNodePosition[] {
	return flattenTree(nodes)
}


/**
 * @module Issue React Query Hooks
 * @description React Query hooks for issue data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { issueApiService, mapIssueFromApi } from '../api'
import type {
	Issue,
	IssueListQueryParams,
	UpdateIssuePayload,
	AddCommentPayload,
} from '../types'

/**
 * Query key factory for issues
 */
export const issueKeys = {
	all: ['issues'] as const,
	lists: () => [...issueKeys.all, 'list'] as const,
	list: (params: IssueListQueryParams) => [...issueKeys.lists(), params] as const,
	details: () => [...issueKeys.all, 'detail'] as const,
	detail: (id: number | string) => [...issueKeys.details(), id] as const,
}

/**
 * Hook to fetch issues list with filters and pagination
 */
export function useIssues(params: IssueListQueryParams = {}) {
	return useQuery({
		queryKey: issueKeys.list(params),
		queryFn: async () => {
			const response = await issueApiService.getIssues(params)
			return {
				data: response.data.data.map(mapIssueFromApi),
				pagination: response.data.pagination,
			}
		},
		staleTime: 1000 * 30, // 30 seconds
	})
}

/**
 * Hook to fetch a single issue by ID
 */
export function useIssue(id: number | string | null) {
	return useQuery({
		queryKey: issueKeys.detail(id!),
		queryFn: async () => {
			if (!id) return null
			const response = await issueApiService.getIssue(id)
			return mapIssueFromApi(response.data)
		},
		enabled: !!id,
		staleTime: 1000 * 30, // 30 seconds
	})
}

/**
 * Hook to update an issue
 */
export function useUpdateIssue() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ id, data }: { id: number | string; data: Partial<UpdateIssuePayload> }) => {
			const response = await issueApiService.updateIssue(id, data)
			return mapIssueFromApi(response.data)
		},
		onSuccess: (updatedIssue, variables) => {
			// Invalidate and refetch issues list
			queryClient.invalidateQueries({ queryKey: issueKeys.lists() })
			// Update the specific issue in cache
			queryClient.setQueryData(issueKeys.detail(variables.id), updatedIssue)
		},
	})
}

/**
 * Hook to add a comment to an issue
 */
export function useAddComment() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ id, data }: { id: number | string; data: AddCommentPayload }) => {
			const response = await issueApiService.addComment(id, data)
			return response.data
		},
		onSuccess: (comment, variables) => {
			// Invalidate the issue detail query to refetch with new comment
			queryClient.invalidateQueries({ queryKey: issueKeys.detail(variables.id) })
			// Also invalidate lists in case comment count is shown
			queryClient.invalidateQueries({ queryKey: issueKeys.lists() })
		},
	})
}


"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useLoading } from "@/context/LoadingContext";
import { useNotification } from "@/hooks/useNotification";
import { logger } from "@workspace/utils";
import { checkPageAccess } from "@/lib/utils/permission.util";
import { FormLayout } from "@/components/form/FormLayout";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import ReactSelect, { type SelectOption } from "@/components/form/inputs/ReactSelect";
import TextInput from "@/components/form/inputs/TextInput";
import TextareaInput from "@/components/form/inputs/TextareaInput";
import { Modal } from "@/components/ui/modal";

import { issueApiService, mapIssueFromApi } from "../api";
import { UserApiService } from "@/app/admin/user/api";
import { useIssue, useUpdateIssue, useAddComment } from "../hooks/useIssues";
import type { Issue, IssueStatus, IssueSeverity, IssueFormData, IssueScreenshot } from "../types";
import { SearchField } from "@/components/ui/table";
import { ClientDateFormatter } from "@/components/ui/ClientDateFormatter";

export default function IssueDetailPage() {
	const router = useRouter();
	const params = useParams();
	const { t } = useTranslation();
	const { showLoading, hideLoading } = useLoading();
	const notification = useNotification();
	const { showError, showSuccess } = notification;
	const [hasPermission, setHasPermission] = useState<boolean | null>(null);
	const [users, setUsers] = useState<SelectOption[]>([]);
	const [loadingUsers, setLoadingUsers] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState<IssueFormData>({});
	const [logSearchQuery, setLogSearchQuery] = useState("");
	const [commentContent, setCommentContent] = useState("");
	
	// Screenshot lightbox state
	const [selectedScreenshot, setSelectedScreenshot] = useState<IssueScreenshot | null>(null);
	const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());
	const [imageLoadingStates, setImageLoadingStates] = useState<Set<number>>(new Set());
	
	// Logs pagination state
	const [logsPage, setLogsPage] = useState(1);
	const [logsPerPage, setLogsPerPage] = useState(20);

	// Extract issue ID from params
	const issueId = params?.id ? (params.id as string) : null;
	const issueIdNum = issueId ? parseInt(issueId, 10) : null;

	// Use React Query hooks
	const { data: issue, isLoading: loading } = useIssue(issueIdNum);
	const updateIssueMutation = useUpdateIssue();
	const addCommentMutation = useAddComment();

	// Check page permission
	useEffect(() => {
		checkPageAccess(
			{ module: "issue", action: "get_detail", type: "admin" },
			(denied) => {
				if (denied) {
					showError({
						message: t("common.errors.noPermission"),
					});
					router.push("/admin/issues");
				}
			}
		).then(setHasPermission);
	}, [router, showError, t]);

	// Load users for assignee dropdown
	useEffect(() => {
		if (!hasPermission) return;

		let mounted = true;
		(async () => {
			try {
				setLoadingUsers(true);
				const allUsers: any[] = [];
				let currentPage = 1;
				let hasMore = true;
				const limit = 100;

				while (hasMore && mounted) {
					const response = await UserApiService.getUsers({
						page: currentPage,
						limit,
					});

					if (!mounted) return;

					allUsers.push(...response.data.data);

					if (currentPage >= response.data.pagination.totalPages) {
						hasMore = false;
					} else {
						currentPage++;
					}
				}

				if (!mounted) return;

				const options: SelectOption[] = [
					{ value: -1, label: t("common.label.unassigned") },
					...allUsers.map((user) => ({
						value: parseInt(user.id),
						label: user.name || user.username || user.email || `User #${user.id}`,
					}))];
				setUsers(options);
			} catch (error) {
				logger.error("Failed to load users for assignee", error);
			} finally {
				if (mounted) {
					setLoadingUsers(false);
				}
			}
		})();

		return () => {
			mounted = false;
		};
	}, [hasPermission, t]);

	// Update form data when issue loads
	useEffect(() => {
		if (issue) {
			setFormData({
				description: issue.description || undefined,
				status: issue.status,
				assigneeId: issue.assigneeId,
			});
		}
	}, [issue]);

	const handleSubmit = useCallback(
		async () => {
			if (!issueIdNum) return;

			try {
				showLoading(t("common.message.loading"));
				await updateIssueMutation.mutateAsync({
					id: issueIdNum,
					data: formData,
				});
				showSuccess({
					message: "Issue updated successfully",
				});
				setIsEditing(false);
			} catch (error) {
				logger.error("Failed to update issue", error);
				showError({
					message: (error as Error).message || "Failed to update issue",
				});
			} finally {
				hideLoading();
			}
		},
		[issueIdNum, formData, updateIssueMutation, showLoading, hideLoading, showSuccess, showError, t]
	);

	const handleDownloadScreenshot = useCallback(async (screenshot: any) => {
		if (!screenshot.url) {
			showError({ message: "Screenshot URL not available" });
			return;
		}

		try {
			const response = await fetch(screenshot.url);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `screenshot-${screenshot.id}.${screenshot.mimeType?.split('/')[1] || 'png'}`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			logger.error("Failed to download screenshot", error);
			showError({ message: "Failed to download screenshot" });
		}
	}, [showError]);

	const handleAddComment = useCallback(async () => {
		if (!issueIdNum || !commentContent.trim()) return;

		try {
			showLoading(t("common.message.loading") || "Loading...");
			await addCommentMutation.mutateAsync({
				id: issueIdNum,
				data: { content: commentContent.trim() },
			});
			showSuccess({ message: "Comment added successfully" });
			setCommentContent("");
		} catch (error) {
			logger.error("Failed to add comment", error);
			showError({
				message: (error as Error).message || "Failed to add comment",
			});
		} finally {
			hideLoading();
		}
	}, [issueIdNum, commentContent, addCommentMutation, showLoading, hideLoading, showSuccess, showError, t]);

	// Filter logs by search query
	const filteredLogs = useMemo(() => {
		if (!issue?.logs) return [];
		if (!logSearchQuery.trim()) return issue.logs;
		const query = logSearchQuery.toLowerCase();
		return issue.logs.filter(log =>
			log.message.toLowerCase().includes(query) ||
			(log.stack && log.stack.toLowerCase().includes(query))
		);
	}, [issue?.logs, logSearchQuery]);
	
	// Paginated logs
	const paginatedLogs = useMemo(() => {
		const startIndex = (logsPage - 1) * logsPerPage;
		const endIndex = startIndex + logsPerPage;
		return filteredLogs.slice(startIndex, endIndex);
	}, [filteredLogs, logsPage, logsPerPage]);
	
	const totalLogPages = useMemo(() => {
		return Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));
	}, [filteredLogs.length, logsPerPage]);
	
	// Reset to page 1 when search query changes
	useEffect(() => {
		setLogsPage(1);
	}, [logSearchQuery]);
	
	// Copy to clipboard utility
	const copyToClipboard = useCallback(async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			showSuccess({ message: `${label} copied to clipboard` });
		} catch (error) {
			logger.error("Failed to copy to clipboard", error);
			showError({ message: "Failed to copy to clipboard" });
		}
	}, [showSuccess, showError]);
	
	// Handle image load
	const handleImageLoad = useCallback((screenshotId: number) => {
		setImageLoadingStates(prev => {
			const next = new Set(prev);
			next.delete(screenshotId);
			return next;
		});
	}, []);
	
	// Handle image error
	const handleImageError = useCallback((screenshotId: number) => {
		setImageLoadingStates(prev => {
			const next = new Set(prev);
			next.delete(screenshotId);
			return next;
		});
		setImageLoadErrors(prev => new Set(prev).add(screenshotId));
	}, []);
	
	// Handle image start loading
	const handleImageLoadStart = useCallback((screenshotId: number) => {
		setImageLoadingStates(prev => new Set(prev).add(screenshotId));
	}, []);

	const handleCancel = useCallback(() => {
		if (issue) {
			setFormData({
				description: issue.description || undefined,
				status: issue.status,
				assigneeId: issue.assigneeId,
			});
		}
		setIsEditing(false);
	}, [issue]);

	// Format issue data as markdown
	const formatIssueAsMarkdown = useCallback((issueData: Issue): string => {
		const formatDate = (date: Date | null | undefined): string => {
			if (!date) return "N/A";
			return new Date(date).toLocaleString("en-US", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			});
		};

		const formatValue = (value: any): string => {
			if (value === null || value === undefined) return "N/A";
			if (typeof value === "boolean") return value ? "Yes" : "No";
			return String(value);
		};

		const escapeMarkdown = (text: string): string => {
			return text.replace(/\n/g, " ").replace(/\r/g, "");
		};

		let markdown = `# Issue: ${issueData.title || `Issue #${issueData.id}`}\n\n`;

		// Basic Information
		markdown += `## Basic Information\n`;
		markdown += `- **ID**: ${issueData.id}\n`;
		markdown += `- **Status**: ${formatValue(issueData.status)}\n`;
		markdown += `- **Severity**: ${formatValue(issueData.severity)}\n`;
		markdown += `- **Project**: ${issueData.project?.name || "N/A"}\n`;
		markdown += `- **Assignee**: ${
			issueData.assignee
				? `${issueData.assignee.name || issueData.assignee.email || "Unknown"} (${issueData.assignee.email || "No email"})`
				: "Unassigned"
		}\n`;
		markdown += `- **Created**: ${formatDate(issueData.createdAt)}\n`;
		markdown += `- **Updated**: ${formatDate(issueData.updatedAt)}\n\n`;

		// Description
		markdown += `## Description\n`;
		markdown += `${issueData.description || "No description provided"}\n\n`;

		// Reporter Information
		markdown += `## Reporter Information\n`;
		if (issueData.reporterInfo) {
			markdown += `- **Name**: ${formatValue(issueData.reporterInfo.name)}\n`;
			markdown += `- **Email**: ${formatValue(issueData.reporterInfo.email)}\n`;
			markdown += `- **ID**: ${formatValue(issueData.reporterInfo.id)}\n`;
		} else {
			markdown += `- **Name**: Unknown\n`;
			markdown += `- **Email**: Unknown\n`;
			markdown += `- **ID**: Unknown\n`;
		}
		markdown += `\n`;

		// Environment Metadata
		if (issueData.metadata) {
			markdown += `## Environment Metadata\n`;
			markdown += `- **URL**: ${formatValue(issueData.metadata.url)}\n`;
			markdown += `- **User Agent**: ${formatValue(issueData.metadata.userAgent)}\n`;
			if (issueData.metadata.viewport) {
				markdown += `- **Viewport**: ${issueData.metadata.viewport.width} x ${issueData.metadata.viewport.height}\n`;
			}
			if (issueData.metadata.screen) {
				markdown += `- **Screen**: ${issueData.metadata.screen.width} x ${issueData.metadata.screen.height}\n`;
			}
			markdown += `- **Language**: ${formatValue(issueData.metadata.language)}\n`;
			markdown += `- **Timezone**: ${formatValue(issueData.metadata.timezone)}\n`;
			markdown += `- **Timestamp**: ${formatValue(issueData.metadata.timestamp)}\n`;
			markdown += `\n`;
		}

		// Screenshots
		if (issueData.screenshots && issueData.screenshots.length > 0) {
			markdown += `## Screenshots (${issueData.screenshots.length})\n\n`;
			issueData.screenshots.forEach((screenshot, index) => {
				markdown += `### Screenshot #${screenshot.id}${index > 0 ? ` (${index + 1})` : ""}\n`;
				if (screenshot.width && screenshot.height) {
					markdown += `- **Dimensions**: ${screenshot.width} x ${screenshot.height}\n`;
				}
				if (screenshot.fileSize) {
					markdown += `- **File Size**: ${(screenshot.fileSize / 1024).toFixed(2)} KB\n`;
				}
				markdown += `- **Created**: ${formatDate(screenshot.createdAt)}\n`;

				if (screenshot.elementSelector) {
					markdown += `\n#### Element Selector\n`;
					markdown += `- **CSS Selector**: \`${escapeMarkdown(screenshot.elementSelector.cssSelector)}\`\n`;
					markdown += `- **XPath**: \`${escapeMarkdown(screenshot.elementSelector.xpath)}\`\n`;
					if (screenshot.elementSelector.boundingBox) {
						const bb = screenshot.elementSelector.boundingBox;
						markdown += `- **Bounding Box**: x=${bb.x}, y=${bb.y}, width=${bb.width}, height=${bb.height}\n`;
					}
					if (screenshot.elementSelector.outerHTML) {
						// Truncate very long HTML (limit to 2000 chars)
						let html = screenshot.elementSelector.outerHTML;
						if (html.length > 2000) {
							html = html.substring(0, 2000) + "\n... (truncated)";
						}
						markdown += `- **Outer HTML**:\n`;
						markdown += `\`\`\`html\n${html}\n\`\`\`\n`;
					}
				}
				markdown += `\n`;
			});
		}

		// Console Logs
		const consoleLogs = issueData.logs?.filter((log) => log.logType === "console") || [];
		if (consoleLogs.length > 0) {
			markdown += `## Console Logs (${consoleLogs.length})\n\n`;
			consoleLogs.forEach((log) => {
				markdown += `### ${log.logType} - ${log.level || "log"} (${formatDate(log.timestamp)})\n`;
				markdown += `**Message**: ${escapeMarkdown(log.message)}\n`;
				if (log.stack) {
					// Truncate very long stack traces (limit to 3000 chars)
					let stack = log.stack;
					if (stack.length > 3000) {
						stack = stack.substring(0, 3000) + "\n... (truncated)";
					}
					markdown += `\n**Stack Trace**:\n`;
					markdown += `\`\`\`\n${stack}\n\`\`\`\n`;
				}
				if (log.metadata) {
					markdown += `\n**Metadata**:\n`;
					markdown += `\`\`\`json\n${JSON.stringify(log.metadata, null, 2)}\n\`\`\`\n`;
				}
				markdown += `\n`;
			});
		}

		// Error Logs
		const errorLogs = issueData.logs?.filter((log) => log.logType === "error") || [];
		if (errorLogs.length > 0) {
			markdown += `## Error Logs (${errorLogs.length})\n\n`;
			errorLogs.forEach((log) => {
				markdown += `### Error - ${log.level || "error"} (${formatDate(log.timestamp)})\n`;
				markdown += `**Message**: ${escapeMarkdown(log.message)}\n`;
				if (log.stack) {
					let stack = log.stack;
					if (stack.length > 3000) {
						stack = stack.substring(0, 3000) + "\n... (truncated)";
					}
					markdown += `\n**Stack Trace**:\n`;
					markdown += `\`\`\`\n${stack}\n\`\`\`\n`;
				}
				if (log.metadata) {
					markdown += `\n**Metadata**:\n`;
					markdown += `\`\`\`json\n${JSON.stringify(log.metadata, null, 2)}\n\`\`\`\n`;
				}
				markdown += `\n`;
			});
		}

		// Network Logs
		const networkLogs = issueData.logs?.filter((log) => log.logType === "network") || [];
		if (networkLogs.length > 0) {
			markdown += `## Network Logs (${networkLogs.length})\n\n`;
			networkLogs.forEach((log) => {
				markdown += `### Network Request (${formatDate(log.timestamp)})\n`;
				markdown += `**Message**: ${escapeMarkdown(log.message)}\n`;
				if (log.metadata) {
					const meta = log.metadata as any;
					if (meta.url) markdown += `- **URL**: ${formatValue(meta.url)}\n`;
					if (meta.method) markdown += `- **Method**: ${formatValue(meta.method)}\n`;
					if (meta.status) markdown += `- **Status**: ${formatValue(meta.status)}\n`;
					if (meta.statusText) markdown += `- **Status Text**: ${formatValue(meta.statusText)}\n`;
					if (meta.responseTime) markdown += `- **Response Time**: ${formatValue(meta.responseTime)}ms\n`;
					if (meta.size) markdown += `- **Size**: ${formatValue(meta.size)}\n`;
					
					// Include other metadata as JSON if there are additional fields
					const otherMeta: any = {};
					Object.keys(meta).forEach((key) => {
						if (!["url", "method", "status", "statusText", "responseTime", "size"].includes(key)) {
							otherMeta[key] = meta[key];
						}
					});
					if (Object.keys(otherMeta).length > 0) {
						markdown += `\n**Additional Metadata**:\n`;
						markdown += `\`\`\`json\n${JSON.stringify(otherMeta, null, 2)}\n\`\`\`\n`;
					}
				}
				markdown += `\n`;
			});
		}

		// Comments
		if (issueData.comments && issueData.comments.length > 0) {
			markdown += `## Comments (${issueData.comments.length})\n\n`;
			issueData.comments.forEach((comment) => {
				const userName = comment.user?.name || comment.user?.email || "Unknown User";
				markdown += `### ${userName} - ${formatDate(comment.createdAt)}\n`;
				markdown += `${comment.content}\n\n`;
			});
		}

		// Footer
		markdown += `---\n`;
		markdown += `*Generated from Issue Collector Platform - Issue #${issueData.id}*\n`;

		return markdown;
	}, []);

	// Handle copy issue data
	const handleCopyIssueData = useCallback(async () => {
		if (!issue) {
			showError({ message: "No issue data available to copy" });
			return;
		}

		try {
			const markdown = formatIssueAsMarkdown(issue);
			await copyToClipboard(markdown, "Issue data");
		} catch (error) {
			logger.error("Failed to copy issue data", error);
			showError({ message: "Failed to copy issue data to clipboard" });
		}
	}, [issue, formatIssueAsMarkdown, copyToClipboard, showError]);

	const handleCancelNavigation = useCallback(() => {
		router.push("/admin/issues");
	}, [router]);

	const statusOptions: SelectOption[] = useMemo(
		() => [
			{ value: "open", label: t("admin.issue.status.open") },
			{ value: "in_progress", label: t("admin.issue.status.inProgress") },
			{ value: "resolved", label: t("admin.issue.status.resolved") },
			{ value: "closed", label: t("admin.issue.status.closed") },
		],
		[t]
	);

	const severityOptions: SelectOption[] = useMemo(
		() => [
			{ value: "low", label: t("admin.issue.severity.low") },
			{ value: "medium", label: t("admin.issue.severity.medium") },
			{ value: "high", label: t("admin.issue.severity.high") },
			{ value: "critical", label: t("admin.issue.severity.critical") },
		],
		[t]
	);

	const statusColorMap: Record<IssueStatus, "info" | "success" | "warning" | "error" | "light"> = {
		open: "info",
		in_progress: "warning",
		resolved: "success",
		closed: "light",
	};

	const severityColorMap: Record<IssueSeverity, "info" | "warning" | "error"> = {
		low: "info",
		medium: "warning",
		high: "error",
		critical: "error",
	};

	if (hasPermission === false || loading) {
		return null;
	}

	if (!issue) {
		return null;
	}

	const breadcrumbs = [
		{ label: t("common.label.dashboard"), href: "/admin/dashboard" },
		{ label: t("common.label.issues"), href: "/admin/issues" },
		{ label: issue.title || `Issue #${issue.id}` },
	];

	const actions = (
		<div className="flex items-center gap-2">
			{isEditing ? (
				<>
					<Button variant="outline" onClick={handleCancel}>
						{t("common.button.cancel")}
					</Button>
					<Button variant="primary" onClick={handleSubmit}>
						{t("common.button.save")}
					</Button>
				</>
			) : (
				<>
					<Button variant="outline" onClick={handleCancelNavigation}>
						{t("common.button.back")}
					</Button>
					<Button variant="outline" onClick={handleCopyIssueData}>
						{t("common.button.copy") || "Copy"}
					</Button>
					<Button variant="primary" onClick={() => setIsEditing(true)}>
						{t("common.button.edit")}
					</Button>
				</>
			)}
		</div>
	);

	return (
		<FormLayout
			title={issue.title}
			description={`Issue #${issue.id}`}
			breadcrumbs={breadcrumbs}
			actions={actions}
		>
			<div className="space-y-6">
				{/* Basic Information */}
				<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
					<div className="mb-4 flex items-center gap-2">
						<svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
							{t("common.label.basicInformation")}
						</h3>
					</div>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div className="md:col-span-2">
							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
									{t("common.label.title")}
								</label>
								<p className="text-gray-900 dark:text-white">{issue.title}</p>
							</div>
						</div>

						<div className="md:col-span-2">
							{isEditing ? (
								<TextareaInput
									label={t("common.label.description")}
									value={formData.description || ""}
									onChange={(value) => setFormData({ ...formData, description: value })}
									rows={4}
								/>
							) : (
								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										{t("common.label.description")}
									</label>
									<p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
										{issue.description || <span className="text-gray-400 italic">No description</span>}
									</p>
								</div>
							)}
						</div>

						<div>
							{isEditing ? (
								<ReactSelect
									label={t("common.label.status")}
									options={statusOptions}
									value={formData.status || issue.status}
									onChange={(value) => {
										// Convert backend status (in-progress) to frontend status (in_progress)
										const statusValue = value === 'in-progress' ? 'in_progress' : value as IssueStatus;
										setFormData({ ...formData, status: statusValue });
									}}
								/>
							) : (
								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										{t("common.label.status")}
									</label>
									<Badge color={statusColorMap[issue.status]} size="sm">
										{issue.status.replace(/_/g, " ")}
									</Badge>
								</div>
							)}
						</div>

						<div>
							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
									{t("common.label.severity")}
								</label>
								<Badge color={severityColorMap[issue.severity]} size="sm">
									{issue.severity}
								</Badge>
							</div>
						</div>

						<div>
							{isEditing ? (
								<ReactSelect
									label={t("common.label.assignee")}
									options={users}
									value={formData.assigneeId ?? -1}
									onChange={(value) => setFormData({ ...formData, assigneeId: value === -1 ? null : (value as number) })}
									isLoading={loadingUsers}
								/>
							) : (
								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										{t("common.label.assignee")}
									</label>
									<p className="text-gray-600 dark:text-gray-400">
										{issue.assignee?.name || issue.assignee?.email || "Unassigned"}
									</p>
								</div>
							)}
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("common.label.project")}
							</label>
							<p className="text-gray-600 dark:text-gray-400">{issue.project?.name || "N/A"}</p>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("common.label.createdAt")}
							</label>
							<p className="text-gray-600 dark:text-gray-400">
								<ClientDateFormatter date={issue.createdAt} />
							</p>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
								{t("common.label.updatedAt")}
							</label>
							<p className="text-gray-600 dark:text-gray-400">
								<ClientDateFormatter date={issue.updatedAt} />
							</p>
						</div>
					</div>
				</div>

				{/* Reporter Information */}
				{issue.reporterInfo && (
					<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
						<div className="mb-4 flex items-center gap-2">
							<svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
								{t("admin.issue.label.reporterInfo")}
							</h3>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							{issue.reporterInfo.name && (
								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										{t("common.label.name")}
									</label>
									<p className="text-gray-600 dark:text-gray-400">{issue.reporterInfo.name}</p>
								</div>
							)}
							{issue.reporterInfo.email && (
								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										{t("common.label.email")}
									</label>
									<p className="text-gray-600 dark:text-gray-400">{issue.reporterInfo.email}</p>
								</div>
							)}
							{issue.reporterInfo.id && (
								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										{t("common.label.userId")}
									</label>
									<p className="text-gray-600 dark:text-gray-400">{issue.reporterInfo.id}</p>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Metadata */}
				{issue.metadata && (
					<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
						<div className="mb-4 flex items-center gap-2">
							<svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
							</svg>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
								{t("admin.issue.label.metadata")}
							</h3>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
									{t("admin.issue.label.url")}
								</label>
								<a
									href={issue.metadata.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 break-all"
								>
									{issue.metadata.url}
								</a>
							</div>
							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
									{t("admin.issue.label.userAgent")}
								</label>
								<p className="text-sm text-gray-600 dark:text-gray-400 break-all">
									{issue.metadata.userAgent}
								</p>
							</div>
							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
									{t("admin.issue.label.viewport")}
								</label>
								<p className="text-gray-600 dark:text-gray-400">
									{issue.metadata.viewport.width} × {issue.metadata.viewport.height}
								</p>
							</div>
							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
									{t("admin.issue.label.screen")}
								</label>
								<p className="text-gray-600 dark:text-gray-400">
									{issue.metadata.screen.width} × {issue.metadata.screen.height}
								</p>
							</div>
							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
									{t("admin.issue.label.language")}
								</label>
								<p className="text-gray-600 dark:text-gray-400">{issue.metadata.language}</p>
							</div>
							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
									{t("admin.issue.label.timezone")}
								</label>
								<p className="text-gray-600 dark:text-gray-400">{issue.metadata.timezone}</p>
							</div>
							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
									{t("admin.issue.label.timestamp")}
								</label>
								<p className="text-gray-600 dark:text-gray-400">
									<ClientDateFormatter date={issue.metadata.timestamp} />
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Screenshots */}
				<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
					<div className="mb-4 flex items-center gap-2">
						<svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
							{t("admin.issue.label.screenshots")} ({issue?.screenshots?.length || 0})
						</h3>
					</div>
					{issue?.screenshots && issue.screenshots.length > 0 ? (
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{issue.screenshots.map((screenshot) => {
								const isLoading = imageLoadingStates.has(screenshot.id);
								const hasError = imageLoadErrors.has(screenshot.id);
								const hasElementSelector = !!screenshot.elementSelector;
								
								// Debug: Log screenshot data (always log to help diagnose)
								console.log('🔍 Screenshot data:', {
									id: screenshot.id,
									url: screenshot.url,
									hasUrl: !!screenshot.url,
									storagePath: screenshot.storagePath,
									storageType: screenshot.storageType,
									hasElementSelector,
									elementSelector: screenshot.elementSelector,
								});
								
								return (
									<div
										key={screenshot.id}
										className="group overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md dark:border-gray-700"
									>
										<div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
											{screenshot.url && !hasError ? (
												<>
													{isLoading && (
														<div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
															<div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-brand-600"></div>
														</div>
													)}
													<img
														src={screenshot.url}
														alt={`Screenshot ${screenshot.id}`}
														className={`h-full w-full cursor-pointer object-contain transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
														onLoad={() => handleImageLoad(screenshot.id)}
														onError={() => handleImageError(screenshot.id)}
														onLoadStart={() => handleImageLoadStart(screenshot.id)}
														onClick={() => setSelectedScreenshot(screenshot)}
													/>
													{hasElementSelector && (
														<div className="absolute right-2 top-2 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white shadow-md">
															<svg className="inline h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
															</svg>
															<span className="ml-1">Inspect</span>
														</div>
													)}
													<div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
														<div className="opacity-0 transition-opacity group-hover:opacity-100">
															<Button
																variant="primary"
																size="sm"
																onClick={(e) => {
																	e.stopPropagation();
																	setSelectedScreenshot(screenshot);
																}}
															>
																View Full Size
															</Button>
														</div>
													</div>
												</>
											) : (
												<div className="flex h-full flex-col items-center justify-center p-4 text-center text-gray-400">
													<svg className="mb-2 h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
													</svg>
													<p className="text-sm">{t("admin.issue.label.noImage")}</p>
													{hasError && (
														<p className="mt-1 text-xs text-red-500">Failed to load image</p>
													)}
													{!screenshot.url && (
														<p className="mt-1 text-xs text-orange-500">
															{screenshot.storagePath ? `File not found: ${screenshot.storagePath}` : 'No screenshot URL available'}
														</p>
													)}
													{hasElementSelector && (
														<div className="mt-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
															Element selector data available
														</div>
													)}
												</div>
											)}
										</div>
										<div className="border-t border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
											<div className="mb-2 flex items-center justify-between">
												<div className="text-xs text-gray-600 dark:text-gray-400">
													{screenshot.width && screenshot.height ? (
														<>
															{screenshot.width} × {screenshot.height}
															{screenshot.fileSize && ` • ${(screenshot.fileSize / 1024).toFixed(2)} KB`}
														</>
													) : (
														"N/A"
													)}
												</div>
												{screenshot.url && (
													<Button
														variant="outline"
														size="sm"
														onClick={(e) => {
															e.stopPropagation();
															handleDownloadScreenshot(screenshot);
														}}
													>
														Download
													</Button>
												)}
											</div>
											{screenshot.createdAt && (
												<div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
													Captured: <ClientDateFormatter date={screenshot.createdAt} />
												</div>
											)}
											{hasElementSelector && (
												<div className="mt-2 rounded border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-900/20">
													<div className="mb-2 flex items-center justify-between">
														<span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
															{t("admin.issue.label.elementSelector")}
														</span>
													</div>
													<div className="space-y-2">
														<div>
															<div className="mb-1 flex items-center justify-between">
																<span className="text-xs font-medium text-gray-700 dark:text-gray-300">CSS Selector:</span>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() => copyToClipboard(screenshot.elementSelector!.cssSelector, "CSS Selector")}
																	className="h-6 px-2 text-xs"
																>
																	Copy
																</Button>
															</div>
															<code className="block break-all rounded bg-white px-2 py-1 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200">
																{screenshot.elementSelector?.cssSelector || "N/A"}
															</code>
														</div>
														<div>
															<div className="mb-1 flex items-center justify-between">
																<span className="text-xs font-medium text-gray-700 dark:text-gray-300">XPath:</span>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() => copyToClipboard(screenshot.elementSelector!.xpath, "XPath")}
																	className="h-6 px-2 text-xs"
																>
																	Copy
																</Button>
															</div>
															<code className="block break-all rounded bg-white px-2 py-1 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200">
																{screenshot.elementSelector?.xpath || "N/A"}
															</code>
														</div>
														{screenshot.elementSelector?.boundingBox && (
															<div>
																<span className="text-xs font-medium text-gray-700 dark:text-gray-300">Bounding Box:</span>
																<div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
																	x: {screenshot.elementSelector?.boundingBox?.x ?? 0}, y: {screenshot.elementSelector?.boundingBox?.y ?? 0}, 
																	width: {screenshot.elementSelector?.boundingBox?.width ?? 0}, height: {screenshot.elementSelector?.boundingBox?.height ?? 0}
																</div>
															</div>
														)}
														{screenshot.elementSelector?.outerHTML && (
															<div className="mt-2">
																<div className="mb-1 flex items-center justify-between">
																	<span className="text-xs font-medium text-gray-700 dark:text-gray-300">Outer HTML:</span>
																	<Button
																		variant="outline"
																		size="sm"
																		onClick={() => copyToClipboard(screenshot.elementSelector!.outerHTML, "Outer HTML")}
																		className="h-6 px-2 text-xs"
																	>
																		Copy HTML
																	</Button>
																</div>
																<div className="max-h-40 overflow-auto rounded bg-white p-2 text-xs dark:bg-gray-800">
																	<pre className="whitespace-pre-wrap break-all text-gray-800 dark:text-gray-200">
																		{screenshot.elementSelector?.outerHTML || "N/A"}
																	</pre>
																</div>
															</div>
														)}
													</div>
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
							<svg className="mb-4 h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<p className="text-gray-500 dark:text-gray-400">{t("admin.issue.label.noScreenshots")}</p>
						</div>
					)}
				</div>

				{/* Element Inspect Details Section */}
				{issue?.screenshots && issue.screenshots.some(s => s.elementSelector) && (
					<div className="rounded-lg border border-blue-200 bg-white p-6 shadow-sm dark:border-blue-800 dark:bg-gray-800">
						<div className="mb-4 flex items-center gap-2">
							<svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
							</svg>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
								{t("admin.issue.label.elementInspectDetails")}
							</h3>
							<Badge color="info" className="ml-2">
								{issue.screenshots.filter(s => s.elementSelector).length} {t("admin.issue.label.screenshots")}
							</Badge>
						</div>
						<div className="space-y-4">
							{issue.screenshots
								.filter(screenshot => screenshot.elementSelector)
								.map((screenshot) => (
									<div
										key={screenshot.id}
										className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
									>
										<div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
											<div className="flex items-center gap-2">
												<span className="text-sm font-semibold text-gray-900 dark:text-white">
													{t("admin.issue.label.screenshot")} #{screenshot.id}
												</span>
												{screenshot.createdAt && (
													<span className="text-xs text-gray-500 dark:text-gray-400">
														• <ClientDateFormatter date={screenshot.createdAt} />
													</span>
												)}
											</div>
											{screenshot.url && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => setSelectedScreenshot(screenshot)}
												>
													View Screenshot
												</Button>
											)}
										</div>
										{screenshot.elementSelector && (
											<div className="space-y-4">
												{/* CSS Selector */}
												<div>
													<div className="mb-2 flex items-center justify-between">
														<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
															CSS Selector
														</label>
														<Button
															variant="outline"
															size="sm"
															onClick={() => copyToClipboard(screenshot.elementSelector!.cssSelector, "CSS Selector")}
															className="h-7 px-3 text-xs"
														>
															<svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
															</svg>
															Copy
														</Button>
													</div>
													<code className="block w-full break-all rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
														{screenshot.elementSelector?.cssSelector || "N/A"}
													</code>
												</div>

												{/* XPath */}
												<div>
													<div className="mb-2 flex items-center justify-between">
														<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
															XPath
														</label>
														<Button
															variant="outline"
															size="sm"
															onClick={() => copyToClipboard(screenshot.elementSelector!.xpath, "XPath")}
															className="h-7 px-3 text-xs"
														>
															<svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
															</svg>
															Copy
														</Button>
													</div>
													<code className="block w-full break-all rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
														{screenshot.elementSelector?.xpath || "N/A"}
													</code>
												</div>

												{/* Bounding Box */}
												{screenshot.elementSelector?.boundingBox && (
													<div>
														<label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
															Bounding Box
														</label>
														<div className="grid grid-cols-2 gap-3 rounded-md border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
															<div>
																<span className="text-xs text-gray-500 dark:text-gray-400">X Position</span>
																<div className="text-sm font-medium text-gray-900 dark:text-white">
																	{screenshot.elementSelector?.boundingBox?.x ?? 0}px
																</div>
															</div>
															<div>
																<span className="text-xs text-gray-500 dark:text-gray-400">Y Position</span>
																<div className="text-sm font-medium text-gray-900 dark:text-white">
																	{screenshot.elementSelector?.boundingBox?.y ?? 0}px
																</div>
															</div>
															<div>
																<span className="text-xs text-gray-500 dark:text-gray-400">Width</span>
																<div className="text-sm font-medium text-gray-900 dark:text-white">
																	{screenshot.elementSelector?.boundingBox?.width ?? 0}px
																</div>
															</div>
															<div>
																<span className="text-xs text-gray-500 dark:text-gray-400">Height</span>
																<div className="text-sm font-medium text-gray-900 dark:text-white">
																	{screenshot.elementSelector?.boundingBox?.height ?? 0}px
																</div>
															</div>
														</div>
													</div>
												)}

												{/* Outer HTML */}
												{screenshot.elementSelector?.outerHTML && (
													<div>
														<div className="mb-2 flex items-center justify-between">
															<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
																Outer HTML
															</label>
															<Button
																variant="outline"
																size="sm"
																onClick={() => copyToClipboard(screenshot.elementSelector!.outerHTML, "Outer HTML")}
																className="h-7 px-3 text-xs"
															>
																<svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
																</svg>
																Copy HTML
															</Button>
														</div>
														<div className="max-h-64 overflow-auto rounded-md border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
															<pre className="whitespace-pre-wrap break-all text-xs text-gray-800 dark:text-gray-200">
																{screenshot.elementSelector?.outerHTML || "N/A"}
															</pre>
														</div>
													</div>
												)}
											</div>
										)}
									</div>
								))}
						</div>
					</div>
				)}
				
				{/* Screenshot Lightbox Modal */}
				{selectedScreenshot && (
					<Modal
						isOpen={!!selectedScreenshot}
						onClose={() => setSelectedScreenshot(null)}
						className="max-w-7xl"
						contentClassName="p-6"
					>
						<div className="space-y-4">
							<h3 className="text-xl font-semibold text-gray-900 dark:text-white">
								Screenshot #{selectedScreenshot.id}
							</h3>
							{selectedScreenshot.url && (
								<div className="relative max-h-[80vh] overflow-auto rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900">
									<img
										src={selectedScreenshot.url}
										alt={`Screenshot ${selectedScreenshot.id}`}
										className="h-auto w-full object-contain"
									/>
								</div>
							)}
							<div className="flex flex-wrap gap-2">
								{selectedScreenshot.url && (
									<Button
										variant="primary"
										onClick={() => handleDownloadScreenshot(selectedScreenshot)}
									>
										Download Screenshot
									</Button>
								)}
								{selectedScreenshot.width && selectedScreenshot.height && (
									<div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
										<span className="text-sm text-gray-600 dark:text-gray-400">
											{selectedScreenshot.width} × {selectedScreenshot.height}
											{selectedScreenshot.fileSize && ` • ${(selectedScreenshot.fileSize / 1024).toFixed(2)} KB`}
										</span>
									</div>
								)}
							</div>
							{selectedScreenshot.elementSelector && (
								<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
									<h4 className="mb-3 text-sm font-semibold text-blue-700 dark:text-blue-300">
										Element Inspect Information
									</h4>
									<div className="space-y-3">
										<div>
											<div className="mb-1 flex items-center justify-between">
												<span className="text-sm font-medium text-gray-700 dark:text-gray-300">CSS Selector:</span>
												<Button
													variant="outline"
													size="sm"
													onClick={() => copyToClipboard(selectedScreenshot.elementSelector!.cssSelector, "CSS Selector")}
												>
													Copy
												</Button>
											</div>
											<code className="block break-all rounded bg-white px-3 py-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
												{selectedScreenshot.elementSelector.cssSelector}
											</code>
										</div>
										<div>
											<div className="mb-1 flex items-center justify-between">
												<span className="text-sm font-medium text-gray-700 dark:text-gray-300">XPath:</span>
												<Button
													variant="outline"
													size="sm"
													onClick={() => copyToClipboard(selectedScreenshot.elementSelector!.xpath, "XPath")}
												>
													Copy
												</Button>
											</div>
											<code className="block break-all rounded bg-white px-3 py-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
												{selectedScreenshot.elementSelector.xpath}
											</code>
										</div>
										{selectedScreenshot.elementSelector.boundingBox && (
											<div>
												<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bounding Box:</span>
												<div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
													x: {selectedScreenshot.elementSelector.boundingBox.x}, y: {selectedScreenshot.elementSelector.boundingBox.y}, 
													width: {selectedScreenshot.elementSelector.boundingBox.width}, height: {selectedScreenshot.elementSelector.boundingBox.height}
												</div>
											</div>
										)}
										{selectedScreenshot.elementSelector.outerHTML && (
											<div>
												<div className="mb-2 flex items-center justify-between">
													<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Outer HTML:</span>
													<Button
														variant="outline"
														size="sm"
														onClick={() => copyToClipboard(selectedScreenshot.elementSelector!.outerHTML, "Outer HTML")}
													>
														Copy HTML
													</Button>
												</div>
												<div className="max-h-64 overflow-auto rounded bg-white p-3 text-xs dark:bg-gray-800">
													<pre className="whitespace-pre-wrap break-all text-gray-800 dark:text-gray-200">
														{selectedScreenshot.elementSelector.outerHTML}
													</pre>
												</div>
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</Modal>
				)}

				{/* Logs */}
				<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
					<div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-2">
							<svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
								{t("admin.issue.label.logs")} 
								{issue?.logs && (
									<span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
										({filteredLogs.length} / {issue.logs.length})
									</span>
								)}
							</h3>
						</div>
						<div className="w-full sm:w-64">
							<SearchField
								value={logSearchQuery}
								onChange={setLogSearchQuery}
								placeholder="Search logs..."
							/>
						</div>
					</div>
					{issue?.logs && issue.logs.length > 0 ? (
						<>
							{filteredLogs.length > 0 ? (
								<>
									<div className="space-y-2">
										{paginatedLogs.map((log) => {
											const levelColorMap: Record<string, "info" | "warning" | "error"> = {
												log: "info",
												info: "info",
												warn: "warning",
												error: "error",
												debug: "info",
											};
											return (
												<div
													key={log.id}
													className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
												>
													<div className="flex items-start justify-between">
														<div className="flex-1">
															<div className="mb-1 flex flex-wrap items-center gap-2">
																<Badge color={log.level ? (levelColorMap[log.level] || "info") : "info"} size="sm">
																	{log.level?.toUpperCase() || "UNKNOWN"}
																</Badge>
																<span className="text-xs text-gray-500 dark:text-gray-400">
																	<ClientDateFormatter date={log.timestamp} />
																</span>
															</div>
															<p className="text-sm text-gray-900 dark:text-white break-words">{log.message}</p>
															{log.stack && (
																<details className="mt-2">
																	<summary className="cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300">
																		{t("admin.issue.label.stackTrace")}
																	</summary>
																	<pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
																		{log.stack}
																	</pre>
																</details>
															)}
															{log.metadata && (
																<details className="mt-2">
																	<summary className="cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300">
																		{t("admin.issue.label.metadata")}
																	</summary>
																	<pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
																		{JSON.stringify(log.metadata, null, 2)}
																	</pre>
																</details>
															)}
														</div>
													</div>
												</div>
											);
										})}
									</div>
									{totalLogPages > 1 && (
										<div className="mt-4 flex flex-col gap-3 border-t border-gray-200 px-0 pt-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
											<span className="text-sm text-gray-600 dark:text-gray-300">
												{t("common.table.paginationSummary", {
													from: filteredLogs.length === 0 ? 0 : (logsPage - 1) * logsPerPage + 1,
													to: Math.min(logsPage * logsPerPage, filteredLogs.length),
													total: filteredLogs.length,
												}) || `Showing ${(logsPage - 1) * logsPerPage + 1} to ${Math.min(logsPage * logsPerPage, filteredLogs.length)} of ${filteredLogs.length} logs`}
											</span>
											<div className="flex items-center space-x-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => setLogsPage(Math.max(1, logsPage - 1))}
													disabled={logsPage <= 1}
												>
													{t("common.button.previous")}
												</Button>
												<span className="text-sm text-gray-600 dark:text-gray-300">
													{t("common.table.pageOf", { page: logsPage, totalPages: totalLogPages }) || `Page ${logsPage} of ${totalLogPages}`}
												</span>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setLogsPage(Math.min(totalLogPages, logsPage + 1))}
													disabled={logsPage >= totalLogPages}
												>
													{t("common.button.next")}
												</Button>
												<ReactSelect
													className="ml-3 min-w-[120px]"
													options={[
														{ value: 10, label: "10 per page" },
														{ value: 20, label: "20 per page" },
														{ value: 50, label: "50 per page" },
														{ value: 100, label: "100 per page" },
													]}
													value={logsPerPage}
													onChange={(value) => {
														const nextValue = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
														if (!Number.isNaN(nextValue)) {
															setLogsPerPage(nextValue);
															setLogsPage(1);
														}
													}}
													isClearable={false}
													isSearchable={false}
												/>
											</div>
										</div>
									)}
								</>
							) : (
								<div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
									<svg className="mb-4 h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
									<p className="text-gray-500 dark:text-gray-400">
										{t("admin.issue.label.noLogsFound")}
									</p>
								</div>
							)}
						</>
					) : (
						<div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
							<svg className="mb-4 h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<p className="text-gray-500 dark:text-gray-400">{t("admin.issue.label.noLogs")}</p>
						</div>
					)}
				</div>

				{/* Comments */}
				<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
					<div className="mb-4 flex items-center gap-2">
						<svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
							{t("admin.issue.label.comments")} ({issue?.comments?.length || 0})
						</h3>
					</div>
					
					{/* Comments List */}
					{issue?.comments && issue.comments.length > 0 && (
						<div className="mb-6 space-y-4">
							{issue.comments.map((comment) => (
								<div
									key={comment.id}
									className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
								>
									<div className="mb-2 flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium text-gray-900 dark:text-white">
												{comment.user.name || comment.user.email || `User #${comment.user.id}`}
											</span>
											<span className="text-xs text-gray-500 dark:text-gray-400">
												<ClientDateFormatter date={comment.createdAt} />
											</span>
										</div>
									</div>
									<p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
										{comment.content}
									</p>
								</div>
							))}
						</div>
					)}

					{/* Add Comment Form */}
					<div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
						<TextareaInput
							label={t("admin.issue.label.addComment")}
							value={commentContent}
							onChange={setCommentContent}
							rows={4}
							placeholder={t("admin.issue.placeholder.comment")}
						/>
						<div className="flex justify-end">
							<Button
								variant="primary"
								size="sm"
								onClick={handleAddComment}
								disabled={!commentContent.trim() || addCommentMutation.isPending}
							>
								{addCommentMutation.isPending
									? t("common.message.loading")
									: t("common.button.add")}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</FormLayout>
	);
}


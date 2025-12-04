"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useLoading } from "@/context/LoadingContext";
import { useNotification } from "@/hooks/useNotification";
import { logger } from "@workspace/utils";
import { checkPageAccess } from "@/lib/utils/permission.util";
import { FormLayout } from "@/components/form/FormLayout";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";

import { mapProjectFromApi, projectApiService } from "@/lib/api/projects";
import type { Project } from "../../types";

export default function TestSDKPage() {
	const router = useRouter();
	const params = useParams();
	const { t } = useTranslation();
	const { showLoading, hideLoading } = useLoading();
	const notification = useNotification();
	const { showError } = notification;
	const [project, setProject] = useState<Project | null>(null);
	const [loading, setLoading] = useState(true);
	const [hasPermission, setHasPermission] = useState<boolean | null>(null);
	const [sdkLoaded, setSdkLoaded] = useState(false);
	const scriptLoadedRef = useRef(false);
	const scriptLoadingRef = useRef(false);
	const [isClient, setIsClient] = useState(false);

	const projectId = params?.id ? parseInt(params.id as string, 10) : null;

	// Prevent hydration mismatch by only rendering SDK-related content on client
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Get API URL using utility function
	const apiUrl = useMemo(() => {
		if (typeof window !== "undefined") {
			// Client-side: use env var or current origin
			const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
			if (envApiUrl) {
				return envApiUrl.replace(/\/$/, "");
			}
			// Fallback to current origin (for same-origin deployment)
			return window.location.origin.replace(/\/$/, "");
		}
		// Server-side: use env var or empty (will be resolved on client)
		return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
	}, []);

	// Get SDK script URL with basePath prefix
	const basePath = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || '/admin';
	const sdkScriptUrl = typeof window !== "undefined"
		? (process.env.NEXT_PUBLIC_SDK_URL || `${basePath}/collector.min.js`)
		: `${basePath}/collector.min.js`;

	// Check page permission
	useEffect(() => {
		checkPageAccess(
			{ module: "project", action: "get_data", type: "admin" },
			(denied) => {
				if (denied) {
					showError({
						message: t("common.errors.noPermission"),
					});
					router.push("/projects");
				}
			}
		).then(setHasPermission);
	}, [router, showError, t]);

	// Load project
	useEffect(() => {
		if (!projectId || isNaN(projectId)) {
			showError({
				message: "Invalid project ID",
			});
			router.push("/projects");
			return;
		}

		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				const response = await projectApiService.getProject(projectId);
				if (!mounted) return;
				const mappedProject = mapProjectFromApi(response.data);
				setProject(mappedProject);
			} catch (error) {
				logger.error("Failed to load project", error);
				showError({
					message: (error as Error).message || "Failed to load project",
				});
				router.push("/projects");
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		})();

		return () => {
			mounted = false;
		};
	}, [projectId, router, showError]);

	// Load SDK script dynamically
	useEffect(() => {
		if (!project?.publicKey || scriptLoadedRef.current) return;

		// Check if script already exists to prevent duplicate loading
		const existingScript = document.querySelector(`script[src="${sdkScriptUrl}"][data-project-key="${project.publicKey}"]`);
		if (existingScript) {
			console.log("SDK script already loaded");
			setSdkLoaded(true);
			scriptLoadedRef.current = true;
			return;
		}

		// CRITICAL: Prevent multiple script loads
		if (scriptLoadingRef.current) {
			console.log("SDK script is already being loaded, skipping...");
			return;
		}
		scriptLoadingRef.current = true;

		const script = document.createElement("script");
		script.src = sdkScriptUrl;
		script.setAttribute("data-project-key", project.publicKey);
		script.setAttribute("data-api-url", apiUrl);
		script.async = true;

		script.onload = () => {
			console.log("SDK script loaded successfully", { src: script.src, projectKey: project.publicKey, apiUrl });
			setSdkLoaded(true);
			scriptLoadedRef.current = true;
			scriptLoadingRef.current = false;
			
			// Wait a bit longer for auto-init, then check
			setTimeout(() => {
				const widget = document.getElementById('issue-collector-widget');
				if (!widget) {
					console.warn("Widget not initialized by auto-init, checking SDK...");
					if (typeof window !== "undefined" && (window as any).IssueCollector) {
						console.log("SDK available, attempting manual init...");
						try {
							(window as any).IssueCollector.init({
								projectKey: project.publicKey,
								apiUrl: apiUrl,
							});
						} catch (error) {
							console.error("Failed to manually initialize SDK:", error);
						}
					} else {
						console.error("SDK IssueCollector object not found");
					}
				} else {
					console.log("Widget initialized successfully");
				}
			}, 500);
		};

		script.onerror = (error) => {
			console.error("Failed to load SDK script", { src: script.src, error });
			scriptLoadingRef.current = false;
			// Only show error once, don't retry
			if (!scriptLoadedRef.current) {
				notification.showError({
					message: `Failed to load SDK script from ${sdkScriptUrl}. Please check the script path.`,
				});
				scriptLoadedRef.current = true; // Mark as attempted to prevent retries
			}
		};

		if (document.body) {
			document.body.appendChild(script);
			console.log("Script element appended to body", { src: script.src, hasProjectKey: !!script.getAttribute('data-project-key') });
		} else {
			console.error("document.body not available, waiting...");
			const checkBody = setInterval(() => {
				if (document.body) {
					clearInterval(checkBody);
					document.body.appendChild(script);
					console.log("Script element appended to body (delayed)");
				}
			}, 100);
			setTimeout(() => clearInterval(checkBody), 5000);
		}

		return () => {
			// Cleanup: destroy widget and remove script if component unmounts
			if (typeof window !== "undefined" && (window as any).IssueCollector) {
				(window as any).IssueCollector.destroy();
			}
			const existingScript = document.querySelector(`script[src="${sdkScriptUrl}"][data-project-key="${project.publicKey}"]`);
			if (existingScript && existingScript.parentNode) {
				existingScript.parentNode.removeChild(existingScript);
			}
			// Remove widget container if it exists
			const existingWidget = document.getElementById('issue-collector-widget');
			if (existingWidget && existingWidget.parentNode) {
				existingWidget.parentNode.removeChild(existingWidget);
			}
		};
	}, [project?.publicKey, apiUrl, sdkScriptUrl, notification]);

	const handleBack = useCallback(() => {
		router.push(`/projects/${projectId}`);
	}, [router, projectId]);

	const handleViewIssues = useCallback(() => {
		router.push(`/issues?projectId=${projectId}`);
	}, [router, projectId]);

	if (!isClient) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<span className="text-sm text-gray-500 dark:text-gray-400">Loading test environment...</span>
			</div>
		);
	}

	if (hasPermission === false || loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<span className="text-sm text-gray-500 dark:text-gray-400">Checking project permissions...</span>
			</div>
		);
	}

	if (!project) {
		return null;
	}

	const breadcrumbs = [
		{ label: t("common.label.dashboard"), href: "/admin/dashboard" },
		{ label: t("common.label.projects"), href: "/admin/projects" },
		{ label: project.name, href: `/admin/projects/${project.id}` },
		{ label: t("admin.project.form.testSDK") },
	];

	return (
		<FormLayout
				title={`Test SDK - ${project.name}`}
				description="Test the Issue Collector SDK with example UI elements. Click the floating button to report issues."
				breadcrumbs={breadcrumbs}
				actions={
					<div className="flex gap-2">
						<Button variant="outline" onClick={handleBack}>
							Back to Project
						</Button>
						<Button variant="primary" onClick={handleViewIssues}>
							View Submitted Issues
						</Button>
					</div>
				}
			>
				<div className="space-y-6">
					{/* Instructions */}
					<div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
						<div className="mb-4 flex items-center justify-between">
							<h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">How to Report an Issue</h3>
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium text-blue-900 dark:text-blue-100">SDK Status:</span>
								{!isClient ? (
									<Badge variant="light" color="warning">⏳ Initializing...</Badge>
								) : sdkLoaded ? (
									<Badge variant="light" color="success">✓ Loaded</Badge>
								) : (
									<Badge variant="light" color="warning">⏳ Loading...</Badge>
								)}
							</div>
						</div>

						{/* Visual Step-by-Step Guide */}
						<div className="space-y-4">
							{/* Step 1 */}
							<div className="flex gap-4 rounded-lg bg-white p-4 dark:bg-gray-800">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
									1
								</div>
								<div className="flex-1">
									<h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
										Find the "Report Issue" Button
									</h4>
									<p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
										Look for the <strong>yellow circular button with an alert triangle icon</strong> (⚠️) in the bottom-right corner of the page.
									</p>
									<div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700">
										<div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 text-white shadow-lg">
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
												<path d="M12 9v4"/>
												<path d="M12 17h.01"/>
											</svg>
										</div>
										<span className="text-sm text-gray-700 dark:text-gray-300">40px circular button with alert icon</span>
									</div>
								</div>
							</div>

							{/* Step 2 */}
							<div className="flex gap-4 rounded-lg bg-white p-4 dark:bg-gray-800">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
									2
								</div>
								<div className="flex-1">
									<h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
										Click to Open Issue Form
									</h4>
									<p className="text-sm text-blue-800 dark:text-blue-200">
										Click the button to open a modal dialog with a form to report your issue. You'll see fields for Title, Description, and Severity.
									</p>
								</div>
							</div>

							{/* Step 3 */}
							<div className="flex gap-4 rounded-lg bg-white p-4 dark:bg-gray-800">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
									3
								</div>
								<div className="flex-1">
									<h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
										Capture Screenshot (Optional)
									</h4>
									<p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
										Click the <strong>"📷 Capture Screenshot"</strong> button to activate inspect mode. Your cursor will change to a crosshair.
									</p>
									<div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/20">
										<div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
											<span className="text-lg">📷</span>
											<span>Click this button → Hover over elements → Click to capture</span>
										</div>
									</div>
								</div>
							</div>

							{/* Step 4 */}
							<div className="flex gap-4 rounded-lg bg-white p-4 dark:bg-gray-800">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
									4
								</div>
								<div className="flex-1">
									<h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
										Select Element to Comment On
									</h4>
									<p className="text-sm text-blue-800 dark:text-blue-200">
										In inspect mode, hover over any element on the page. It will be highlighted. Click the element you want to report an issue about. A screenshot will be captured automatically.
									</p>
								</div>
							</div>

							{/* Step 5 */}
							<div className="flex gap-4 rounded-lg bg-white p-4 dark:bg-gray-800">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
									5
								</div>
								<div className="flex-1">
									<h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
										Fill Out the Form
									</h4>
									<p className="text-sm text-blue-800 dark:text-blue-200">
										Enter a title and description for your issue. Select the severity level. If you captured a screenshot, you'll see a preview.
									</p>
								</div>
							</div>

							{/* Step 6 */}
							<div className="flex gap-4 rounded-lg bg-white p-4 dark:bg-gray-800">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
									6
								</div>
								<div className="flex-1">
									<h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
										Submit Your Issue
									</h4>
									<p className="text-sm text-blue-800 dark:text-blue-200">
										Click the <strong>"Submit"</strong> button. Your issue will be sent to the Issue Collector platform. You can view it in the Issues dashboard.
									</p>
								</div>
							</div>
						</div>

						{/* Quick Test Button */}
						<div className="mt-6 rounded-lg border-2 border-dashed border-blue-300 bg-white p-4 dark:border-blue-700 dark:bg-gray-800">
							<div className="flex items-center justify-between">
								<div>
									<h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Quick Test</h4>
									<p className="text-sm text-blue-800 dark:text-blue-200">
										Can't find the button? Click here to test if the SDK is working:
									</p>
								</div>
								<Button
									variant="primary"
									size="sm"
									onClick={() => {
										if (typeof window !== "undefined" && (window as any).IssueCollector) {
											// Try to trigger the SDK button click programmatically
											const sdkButton = document.querySelector('.issue-collector-button') as HTMLElement;
											if (sdkButton) {
												sdkButton.click();
											} else {
												notification.showError({
													message: "SDK button not found. Please check if the SDK loaded correctly.",
												});
											}
										} else {
											notification.showError({
												message: "SDK not loaded. Please refresh the page.",
											});
										}
									}}
								>
									Open Issue Form
								</Button>
							</div>
						</div>

						<div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-blue-200 dark:border-blue-700">
							<p className="text-xs text-blue-700 dark:text-blue-300">
								<strong>Note:</strong> This is a test simulator page. The SDK is loaded with project key <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded text-xs">{project.publicKey}</code>. 
								All issues submitted here will be linked to this project.
							</p>
						</div>
					</div>

					{/* Example UI Elements */}
					<div className="space-y-6">
						{/* Buttons Section */}
						<div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Buttons</h3>
							<div className="flex flex-wrap gap-3">
								<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
									Primary Button
								</button>
								<button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
									Secondary Button
								</button>
								<button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
									Danger Button
								</button>
								<button className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
									Outline Button
								</button>
							</div>
						</div>

						{/* Form Section */}
						<div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Form Elements</h3>
							<div className="space-y-4 max-w-md">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Email Address
									</label>
									<input
										type="email"
										placeholder="user@example.com"
										className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Message
									</label>
									<textarea
										rows={4}
										placeholder="Enter your message..."
										className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Select Option
									</label>
									<select className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
										<option>Option 1</option>
										<option>Option 2</option>
										<option>Option 3</option>
									</select>
								</div>
							</div>
						</div>

						{/* Cards Section */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							<div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
								<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Card Title 1</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									This is a sample card with some content. You can test screenshot capture on this element.
								</p>
							</div>
							<div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
								<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Card Title 2</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									Another card element for testing. Try capturing screenshots of different elements.
								</p>
							</div>
							<div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
								<h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Card Title 3</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									More content to test with. The SDK should capture all these elements correctly.
								</p>
							</div>
						</div>

						{/* Table Section */}
						<div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
							<div className="p-6 border-b border-gray-200 dark:border-gray-700">
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Table</h3>
							</div>
							<table className="w-full">
								<thead className="bg-gray-50 dark:bg-gray-900">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
											Name
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
											Status
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
											Date
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
									<tr>
										<td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Item 1</td>
										<td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">Active</td>
										<td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">2025-11-21</td>
									</tr>
									<tr>
										<td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Item 2</td>
										<td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">Pending</td>
										<td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">2025-11-20</td>
									</tr>
									<tr>
										<td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Item 3</td>
										<td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">Completed</td>
										<td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">2025-11-19</td>
									</tr>
								</tbody>
							</table>
						</div>

						{/* Large Element Section */}
						<div className="rounded-lg border border-gray-200 bg-gradient-to-r from-purple-500 to-pink-500 p-12 text-center dark:border-gray-700">
							<h3 className="text-2xl font-bold text-white mb-4">Large Element for Testing</h3>
							<p className="text-white/90 mb-6">
								This is a large element with gradient background. Test screenshot capture on this element.
							</p>
							<button className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100">
								Call to Action
							</button>
						</div>

						{/* Navigation Section */}
						<div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Navigation Elements</h3>
							<nav className="flex gap-4">
								<a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
									Home
								</a>
								<a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
									About
								</a>
								<a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
									Services
								</a>
								<a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
									Contact
								</a>
							</nav>
						</div>

						{/* Image Section */}
						<div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sample Image</h3>
							<div className="w-full h-64 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
								<span className="text-white text-lg font-semibold">Sample Image Placeholder</span>
							</div>
						</div>
					</div>
				</div>
			</FormLayout>
	);
}


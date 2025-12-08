"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import ToastContainer from "@/components/ui/notification/ToastContainer";
import { useNotification } from "@/hooks/useNotification";
import type { Project } from "../types";

interface EmbedScriptSectionProps {
	project: Project;
}

export function EmbedScriptSection({ project }: EmbedScriptSectionProps) {
	const notification = useNotification();
	const { toasts, removeToast } = notification;

	// Get API URL from environment or use default
	const apiUrl = useMemo(() => {
		if (typeof window !== "undefined") {
			// Use environment variable if available
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

	// Get SDK script URL - MUST be full absolute URL to work on different sites
	const sdkScriptUrl = useMemo(() => {
		// Check environment variable first (should be full URL)
		const envSdkUrl = process.env.NEXT_PUBLIC_SDK_URL;
		if (envSdkUrl) {
			// If it's already a full URL, return as-is
			if (envSdkUrl.startsWith('http://') || envSdkUrl.startsWith('https://')) {
				return envSdkUrl;
			}
		}
		
		// Client-side: construct full absolute URL
		if (typeof window !== "undefined") {
			// Always use full absolute URL (origin + basePath + script path)
			const basePath = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || '/admin';
			const origin = window.location.origin;
			return `${origin}${basePath}/collector.min.js`;
		}
		
		// Server-side: return empty, will be resolved on client
		return "";
	}, []);

	// Generate embed script code with full absolute URL
	const embedScript = useMemo(() => {
		// Get the script URL (will be empty on server, resolved on client)
		const scriptUrl = sdkScriptUrl || (typeof window !== "undefined" 
			? `${window.location.origin}${process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || '/admin'}/collector.min.js`
			: "");
		
		// If we don't have a URL yet (server-side), return placeholder
		if (!scriptUrl) {
			return "";
		}
		
		return `<script 
  data-project-key="${project.publicKey}"
  data-api-url="${apiUrl}"
  src="${scriptUrl}">
</script>`;
	}, [project.publicKey, apiUrl, sdkScriptUrl]);

	const handleCopy = async () => {
		try {
			// Get the final script with resolved URL
			const finalScript = embedScript || (typeof window !== "undefined" 
				? `<script 
  data-project-key="${project.publicKey}"
  data-api-url="${apiUrl}"
  src="${window.location.origin}${process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || '/admin'}/collector.min.js">
</script>`
				: "");
			
			await navigator.clipboard.writeText(finalScript);
			notification.showSuccess({
				message: "Embed script copied to clipboard successfully!",
			});
		} catch (error) {
			notification.showError({
				message: "Failed to copy script. Please copy manually.",
			});
		}
	};

	return (
		<>
			<ToastContainer toasts={toasts} onRemoveToast={removeToast} />
			<div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
				<div className="mb-3">
					<div className="mb-2 flex items-center justify-between">
						<h3 className="text-sm font-semibold text-gray-900 dark:text-white">Deployment Script</h3>
						<Button variant="outline" size="sm" onClick={handleCopy}>
							Copy
						</Button>
					</div>
					<p className="text-xs text-gray-500 dark:text-gray-400">
						Copy and paste this script into your website to enable issue collection
					</p>
				</div>

				<div className="relative">
					<pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs dark:bg-gray-900">
						<code className="font-mono text-gray-900 dark:text-gray-100">
							{embedScript || (typeof window !== "undefined" 
								? `<script 
  data-project-key="${project.publicKey}"
  data-api-url="${apiUrl}"
  src="${window.location.origin}${process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || '/admin'}/collector.min.js">
</script>`
								: "Loading script URL...")}
						</code>
					</pre>
				</div>

				<div className="mt-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
					<h4 className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1.5">Instructions</h4>
					<ol className="list-decimal list-inside space-y-1 text-xs text-blue-800 dark:text-blue-200">
						<li>Copy the script above</li>
						<li>Paste it before the closing <code className="rounded bg-blue-100 px-1 py-0.5 text-[10px] dark:bg-blue-800">{"</body>"}</code> tag</li>
						<li>The floating "Report Issue" button will appear</li>
					</ol>
				</div>

				<div className="mt-3 flex items-center gap-2">
					<Link
						href={`/admin/projects/${project.id}/test`}
						className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
					>
						Test SDK →
					</Link>
				</div>
			</div>
		</>
	);
}


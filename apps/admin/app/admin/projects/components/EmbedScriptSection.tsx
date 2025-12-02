"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { useNotification } from "@/hooks/useNotification";
import type { Project } from "../types";

interface EmbedScriptSectionProps {
	project: Project;
}

export function EmbedScriptSection({ project }: EmbedScriptSectionProps) {
	const notification = useNotification();

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

	// Get SDK script URL (for now, use local build path - can be configured for CDN)
	const sdkScriptUrl = useMemo(() => {
		// Check environment variable first
		const envSdkUrl = process.env.NEXT_PUBLIC_SDK_URL;
		if (envSdkUrl) {
			return envSdkUrl;
		}
		
		// Client-side: use relative path or current origin
		if (typeof window !== "undefined") {
			// In production, use relative path (works with nginx)
			const isProduction = window.location.origin.startsWith('https://') || 
			                     (!window.location.origin.includes('localhost') && 
			                      !window.location.origin.includes('127.0.0.1'));
			
			if (isProduction) {
				// Use relative path in production
				return "/collector.min.js";
			}
			
			// Development: use relative path (works with Next.js dev server)
			return "/collector.min.js";
		}
		
		// Server-side fallback: use relative path
		return "/collector.min.js";
	}, []);

	// Generate embed script code
	const embedScript = useMemo(() => {
		return `<script 
  data-project-key="${project.publicKey}"
  data-api-url="${apiUrl}"
  src="${sdkScriptUrl}">
</script>`;
	}, [project.publicKey, apiUrl, sdkScriptUrl]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(embedScript);
			notification.showSuccess({
				message: "Embed script copied to clipboard",
			});
		} catch (error) {
			notification.showError({
				message: "Failed to copy script. Please copy manually.",
			});
		}
	};

	return (
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
					<code className="font-mono text-gray-900 dark:text-gray-100">{embedScript}</code>
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
					href={`/projects/${project.id}/test`}
					className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
				>
					Test SDK →
				</Link>
			</div>
		</div>
	);
}


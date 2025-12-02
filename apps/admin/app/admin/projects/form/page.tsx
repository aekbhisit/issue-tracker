"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useLoading } from "@/context/LoadingContext";
import { useNotification } from "@/hooks/useNotification";
import { logger } from "@workspace/utils";
import { checkPageAccess } from "@/lib/utils/permission.util";

import { projectApiService } from "@/lib/api/projects";
import type { ProjectFormData } from "../types";
import { ProjectForm } from "../components";

export default function CreateProjectPage() {
	const router = useRouter();
	const { t } = useTranslation();
	const { showLoading, hideLoading } = useLoading();
	const notification = useNotification();
	const { showError, showSuccess } = notification;
	const [hasPermission, setHasPermission] = useState<boolean | null>(null);

	// Check page permission
	useEffect(() => {
		checkPageAccess(
			{ module: "project", action: "add_data", type: "admin" },
			(denied) => {
				if (denied) {
					showError({
						message: t("common.errors.noPermission") || "You do not have permission to access this page",
					});
					router.push("/projects");
				}
			}
		).then(setHasPermission);
	}, [router, showError, t]);

	const handleSubmit = useCallback(
		async (data: ProjectFormData) => {
			try {
				showLoading(t("common.message.loading") || "Loading...");
				const response = await projectApiService.createProject(data);
				showSuccess({
					message: "Project created successfully",
				});
				router.push(`/projects/${response.data.id}`);
			} catch (error) {
				logger.error("Failed to create project", error);
				showError({
					message: (error as Error).message || "Failed to create project",
				});
				throw error;
			} finally {
				hideLoading();
			}
		},
		[router, showLoading, hideLoading, showSuccess, showError, t]
	);

	const handleCancel = useCallback(() => {
			router.push("/projects");
			router.push("/projects");
	}, [router]);

	if (hasPermission === false) {
		return null;
	}

	return <ProjectForm isEditMode={false} onSubmit={handleSubmit} onCancel={handleCancel} />;
}


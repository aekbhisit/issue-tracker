"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useLoading } from "@/context/LoadingContext";
import { useNotification } from "@/hooks/useNotification";
import { logger } from "@workspace/utils";
import { checkPageAccess } from "@/lib/utils/permission.util";

import { mapProjectFromApi, projectApiService } from "@/lib/api/projects";
import type { Project, ProjectFormData } from "../types";
import { ProjectForm } from "../components";

export default function EditProjectPage() {
	const router = useRouter();
	const params = useParams();
	const { t } = useTranslation();
	const { showLoading, hideLoading } = useLoading();
	const notification = useNotification();
	const { showError, showSuccess } = notification;
	const [project, setProject] = useState<Project | null>(null);
	const [loading, setLoading] = useState(true);
	const [hasPermission, setHasPermission] = useState<boolean | null>(null);

	const projectId = params?.id ? parseInt(params.id as string, 10) : null;

	// Check page permission
	useEffect(() => {
		checkPageAccess(
			{ module: "project", action: "edit_data", type: "admin" },
			(denied) => {
				if (denied) {
					showError({
						message: t("common.errors.noPermission") || "You do not have permission to access this page",
					});
					router.push("/admin/projects");
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
			router.push("/admin/projects");
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
				router.push("/admin/projects");
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

	const handleSubmit = useCallback(
		async (data: ProjectFormData) => {
			if (!projectId) return;

			try {
				showLoading(t("common.message.loading") || "Loading...");
				await projectApiService.updateProject(projectId, data);
				showSuccess({
					message: "Project updated successfully",
				});
				// Reload project data
				const response = await projectApiService.getProject(projectId);
				const mappedProject = mapProjectFromApi(response.data);
				setProject(mappedProject);
			} catch (error) {
				logger.error("Failed to update project", error);
				showError({
					message: (error as Error).message || "Failed to update project",
				});
				throw error;
			} finally {
				hideLoading();
			}
		},
		[projectId, showLoading, hideLoading, showSuccess, showError, t]
	);

	const handleCancel = useCallback(() => {
		router.push("/admin/projects");
	}, [router]);

	if (hasPermission === false || loading) {
		return null;
	}

	if (!project) {
		return null;
	}

	return <ProjectForm initialProject={project} isEditMode={true} onSubmit={handleSubmit} onCancel={handleCancel} />;
}


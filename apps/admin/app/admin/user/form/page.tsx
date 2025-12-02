"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { PageLoading } from "@/components/ui/loading";
import { logger } from "@workspace/utils";
import { useRouter } from "next/navigation";
import { checkPageAccess } from "@/lib/utils/permission.util";
import { useNotification } from "@/hooks/useNotification";

import { mapUserFromApi, userApiService } from "../../user/api";
import type { User, UserRoleOption } from "../../user/types";
import { UserForm } from "../../user/components/UserForm";

interface UserFormContentProps {
	searchParams: ReturnType<typeof useSearchParams>;
}

function UserFormContentInternal({ searchParams }: UserFormContentProps) {
	const router = useRouter();
	const { t } = useTranslation();
	const notification = useNotification();
	const { showError } = notification;
	const [user, setUser] = useState<User | null>(null);
	const [roles, setRoles] = useState<UserRoleOption[]>([]);
	const [loading, setLoading] = useState(true);
	const [hasPermission, setHasPermission] = useState<boolean | null>(null);
	const idParam = searchParams.get("id");
	const userId = idParam ? parseInt(idParam, 10) : null;

	// Check page permission
	useEffect(() => {
		const action = userId ? "edit_data" : "add_data";
		checkPageAccess(
			{ module: "user", action, type: "admin" },
			(denied) => {
				if (denied) {
					showError({
						message: t("common.errors.noPermission") || "You do not have permission to access this page",
					});
					router.push("/user");
				}
			}
		).then(setHasPermission);
	}, [router, showError, t, userId]);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const roleOptions = await userApiService.getRolesList();
				if (!mounted) return;
				setRoles(roleOptions);
			} catch (error) {
				logger.error("Failed to load roles", error);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		let mounted = true;
		const loadUser = async () => {
			if (userId) {
				setLoading(true);
			}
			if (!userId) {
				setUser(null);
				setLoading(false);
				return;
			}
			try {
				const response = await userApiService.getUser(userId);
				if (!mounted) return;
				setUser(mapUserFromApi(response.data));
			} catch (error) {
				logger.error("Failed to load user", error);
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		};
		loadUser();
		return () => {
			mounted = false;
		};
	}, [userId]);

	// Prevent rendering if permission check is not complete or denied
	if (hasPermission === null) {
		return <PageLoading isVisible message={t("common.message.loading")} />;
	}

	if (!hasPermission) {
		return null;
	}

	if (loading) {
		return <PageLoading isVisible message={t("common.message.loading")} />;
	}

	return <UserForm initialUser={user} roles={roles} isEditMode={Boolean(userId)} />;
}

function UserFormContentWrapper() {
	const searchParams = useSearchParams();
	return <UserFormContentInternal searchParams={searchParams} />;
}

export default function UserFormPage() {
	const { t } = useTranslation();
	return (
		<Suspense fallback={<PageLoading isVisible message={t("common.message.loading")} />}>
			<UserFormContentWrapper />
		</Suspense>
	);
}



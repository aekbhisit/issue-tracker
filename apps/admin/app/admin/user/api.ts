import { apiClient } from "@/lib/api/client";
import { logger } from "@workspace/utils";

import {
	ApiSuccessResponse,
	RolesListApiResponse,
	UpdateUserPayload,
	User,
	UserApiModel,
	UserApiResponse,
	UserFormData,
	UserListApiResponse,
	UserListQuery,
	UserRoleOption,
	UserAvatar,
} from "./types";

function toDate(value: string | null): Date | null {
	return value ? new Date(value) : null;
}

function normalizeRoleId(roleId: number | string | null | undefined): number | null {
	if (roleId === null || roleId === undefined || roleId === "") {
		return null;
	}

	const parsed = typeof roleId === "string" ? parseInt(roleId, 10) : roleId;
	return Number.isFinite(parsed) ? parsed : null;
}

function handleApiError(error: any, fallbackMessage: string): never {
	logger.error(fallbackMessage, error);
	const apiMessage: string | undefined = error?.response?.data?.message;
	throw new Error(apiMessage || fallbackMessage);
}

function parseAvatar(value: UserApiModel["avatar"]): UserAvatar | null {
	if (!value) {
		return null;
	}
	if (typeof value === "object") {
		const src = typeof value.src === "string" ? value.src : null;
		const alt = typeof value.alt === "string" ? value.alt : null;
		return {
			src,
			alt: alt && alt.trim().length > 0 ? alt.trim() : null,
		};
	}
	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value);
			return parseAvatar(parsed as UserAvatar);
		} catch (error) {
			return {
				src: value,
				alt: null,
			};
		}
	}
	return null;
}

function sanitizeAvatar(value: UserFormData["avatar"] | null | undefined): UserAvatar | null {
	if (!value) {
		return null;
	}
	const src = typeof value.src === "string" ? value.src.trim() : null;
	const normalizedSrc = src && src.length > 0 ? src : null;
	const alt = typeof value.alt === "string" ? value.alt.trim() : null;
	const normalizedAlt = alt && alt.length > 0 ? alt : null;
	if (!normalizedSrc && !normalizedAlt) {
		return null;
	}
	return {
		src: normalizedSrc,
		alt: normalizedAlt,
	};
}

export function mapUserFromApi(model: UserApiModel): User {
	return {
		id: model.id.toString(),
		roleId: model.roleId,
		role: model.role ?? undefined,
		name: model.name,
		username: model.username,
		email: model.email,
		avatar: parseAvatar(model.avatar),
		lang: model.lang,
		status: model.status,
		loginAt: toDate(model.loginAt),
		createdAt: new Date(model.createdAt),
		updatedAt: new Date(model.updatedAt),
	};
}

function buildCreatePayload(data: UserFormData) {
	const avatar = sanitizeAvatar(data.avatar);
	return {
		roleId: normalizeRoleId(data.roleId),
		name: data.name,
		username: data.username,
		email: data.email,
		password: data.password,
		lang: data.lang || "en",
		status: data.status,
		avatar: avatar,
	};
}

function buildUpdatePayload(data: UserFormData): UpdateUserPayload {
	const payload: UpdateUserPayload = {
		roleId: normalizeRoleId(data.roleId),
		name: data.name,
		email: data.email,
		lang: data.lang,
		status: data.status,
	};

	if (data.password && data.password.trim().length > 0) {
		payload.password = data.password.trim();
	}

	if (data.avatar === null) {
		payload.avatar = null;
	} else if (data.avatar) {
		const sanitized = sanitizeAvatar(data.avatar);
		payload.avatar = sanitized ?? null;
	}

	return payload;
}

export class UserApiService {
	private static readonly baseUrl = "/user";

	static mapUserFromApi = mapUserFromApi;

	static async getUsers(params: UserListQuery = {}): Promise<UserListApiResponse> {
		try {
			const response = await apiClient.get<UserListApiResponse>(this.baseUrl, {
				params: {
					page: params.page,
					limit: params.limit,
					search: params.search,
					roleId: params.roleId ?? undefined,
					status: params.status ?? undefined,
					sortBy: params.sortBy,
					sortOrder: params.sortOrder,
				},
			});
			return response.data;
		} catch (error) {
			handleApiError(error, "Failed to load users");
		}
	}

	static async getUser(id: number): Promise<UserApiResponse> {
		try {
			const response = await apiClient.get<UserApiResponse>(`${this.baseUrl}/${id}`);
			return response.data;
		} catch (error) {
			handleApiError(error, "Failed to load user");
		}
	}

	static async createUser(data: UserFormData): Promise<UserApiResponse> {
		try {
			const payload = buildCreatePayload(data);
			logger.apiRequest("POST", this.baseUrl, payload);
			const response = await apiClient.post<UserApiResponse>(this.baseUrl, payload);
			logger.apiResponse("POST", this.baseUrl, response.status, response.data);
			return response.data;
		} catch (error) {
			handleApiError(error, "Failed to create user");
		}
	}

	static async updateUser(id: number, data: UserFormData): Promise<UserApiResponse> {
		try {
			const payload = buildUpdatePayload(data);
			logger.apiRequest("PUT", `${this.baseUrl}/${id}`, payload);
			const response = await apiClient.put<UserApiResponse>(`${this.baseUrl}/${id}`, payload);
			logger.apiResponse("PUT", `${this.baseUrl}/${id}`, response.status, response.data);
			return response.data;
		} catch (error) {
			handleApiError(error, "Failed to update user");
		}
	}

	static async updateStatus(id: number, status: boolean): Promise<UserApiResponse> {
		try {
			const payload = { status };
			logger.apiRequest("PATCH", `${this.baseUrl}/${id}/status`, payload);
			const response = await apiClient.patch<UserApiResponse>(`${this.baseUrl}/${id}/status`, payload);
			logger.apiResponse("PATCH", `${this.baseUrl}/${id}/status`, response.status, response.data);
			return response.data;
		} catch (error) {
			handleApiError(error, "Failed to update user status");
		}
	}

	static async updateRole(id: number, roleId: number | string): Promise<UserApiResponse> {
		try {
			const payload = { roleId: normalizeRoleId(roleId) };
			logger.apiRequest("PATCH", `${this.baseUrl}/${id}/role`, payload);
			const response = await apiClient.patch<UserApiResponse>(`${this.baseUrl}/${id}/role`, payload);
			logger.apiResponse("PATCH", `${this.baseUrl}/${id}/role`, response.status, response.data);
			return response.data;
		} catch (error) {
			handleApiError(error, "Failed to update user role");
		}
	}

	static async deleteUser(id: number): Promise<ApiSuccessResponse<null>> {
		try {
			logger.apiRequest("DELETE", `${this.baseUrl}/${id}`);
			const response = await apiClient.delete<ApiSuccessResponse<null>>(`${this.baseUrl}/${id}`);
			logger.apiResponse("DELETE", `${this.baseUrl}/${id}`, response.status, response.data);
			return response.data;
		} catch (error) {
			handleApiError(error, "Failed to delete user");
		}
	}

	static async getRolesList(params: { search?: string } = {}): Promise<UserRoleOption[]> {
		try {
			const response = await apiClient.get<ApiSuccessResponse<RolesListApiResponse>>("/role/list", {
				params: params.search ? { search: params.search } : undefined,
			});
			const rawResults = response.data.data?.results ?? [];
			return rawResults.map((role) => ({
				id: role.id,
				name: role.name ?? role.text ?? "",
				sequence: role.sequence,
			}));
		} catch (error) {
			handleApiError(error, "Failed to load roles");
		}
	}
}

export const userApiService = UserApiService;



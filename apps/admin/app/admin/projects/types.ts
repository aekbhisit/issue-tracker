import {
	ProjectResponse,
	ProjectEnvironmentResponse,
	CreateProjectDto,
	UpdateProjectDto,
	CreateProjectEnvironmentDto,
	UpdateProjectEnvironmentDto,
	ProjectListQuery,
} from "@workspace/types";

/**
 * Project API model (matches backend response)
 */
export type ProjectApiModel = ProjectResponse;

/**
 * Project (client-side, with Date objects)
 */
export interface Project {
	id: string;
	name: string;
	description: string | null;
	publicKey: string;
	privateKey: string;
	status: boolean;
	allowedDomains: string[];
	environments: ProjectEnvironment[];
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
	issueCounts?: {
		total: number;
		pending: number;
	};
}

/**
 * Project Environment (client-side)
 */
export interface ProjectEnvironment {
	id: number;
	projectId: number;
	name: string;
	apiUrl: string | null;
	allowedOrigins: string[] | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Project list query parameters
 */
export interface ProjectListQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: boolean | null;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

/**
 * Project pagination
 */
export interface ProjectPagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

/**
 * Project list API response
 */
export type ProjectListApiResponse = ApiSuccessResponse<{
	data: ProjectApiModel[];
	pagination: ProjectPagination;
}>;

/**
 * Project API response
 */
export type ProjectApiResponse = ApiSuccessResponse<ProjectApiModel>;

/**
 * Project form data
 */
export interface ProjectFormData {
	name: string;
	description: string;
	allowedDomains: string[];
	status: boolean;
	environments?: CreateProjectEnvironmentDto[];
}

/**
 * Update project payload
 */
export interface UpdateProjectPayload {
	name?: string;
	description?: string;
	allowedDomains?: string[];
	status?: boolean;
}

/**
 * Environment form data
 */
export interface EnvironmentFormData {
	name: string;
	apiUrl: string;
	allowedOrigins: string[];
	isActive: boolean;
}

/**
 * API success response shape used by admin app
 */
export interface ApiSuccessResponse<T> {
	data: T;
	message: string;
	status: number;
}


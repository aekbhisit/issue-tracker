export interface UserRole {
	id: number;
	name: string;
	sequence?: number;
}

export interface UserAvatar {
	src: string | null;
	alt?: string | null;
}

export interface UserApiModel {
	id: number;
	roleId: number | null;
	role?: UserRole | null;
	name: string | null;
	username: string | null;
	email: string | null;
	avatar: UserAvatar | string | null;
	lang: string;
	status: boolean;
	loginAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface User {
	id: string;
	roleId: number | null;
	role?: UserRole | null;
	name: string | null;
	username: string | null;
	email: string | null;
	avatar: UserAvatar | null;
	lang: string;
	status: boolean;
	loginAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserListQuery {
	page?: number;
	limit?: number;
	search?: string;
	roleId?: number | null;
	status?: boolean | null;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface UserPagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export type UserListApiResponse = ApiSuccessResponse<{
	data: UserApiModel[];
	pagination: UserPagination;
}>;

export type UserApiResponse = ApiSuccessResponse<UserApiModel>;

export interface UserFormData {
	roleId: number | null;
	name: string;
	username: string;
	email: string;
	password?: string;
	lang: string;
	status: boolean;
	avatar: UserAvatar | null;
}

export interface UpdateUserPayload {
	roleId?: number | null;
	name?: string;
	email?: string;
	password?: string;
	lang?: string;
	status?: boolean;
	avatar?: UserAvatar | null;
}

export interface RolesListApiResponse {
	results: Array<{
		id: number;
		name?: string;
		text?: string;
		sequence?: number;
	}>;
}

export interface UserRoleOption {
	id: number;
	name: string;
	sequence?: number;
}


export interface ApiSuccessResponse<T> {
	data: T;
	message: string;
	status: number;
}



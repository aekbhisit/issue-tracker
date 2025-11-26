/**
 * Issue API model (matches backend response)
 */
export interface IssueApiModel {
	id: number;
	projectId: number;
	title: string;
	description: string | null;
	severity: string;
	status: string;
	assigneeId: number | null;
	reporterInfo: any | null;
	metadata: any | null;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string | null;
	screenshots: IssueScreenshotApiModel[];
	logs: IssueLogApiModel[];
	comments?: IssueCommentApiModel[];
	project?: {
		id: number;
		name: string;
		publicKey: string;
	};
	assignee?: {
		id: number;
		name: string | null;
		email: string | null;
	} | null;
}

/**
 * Issue Screenshot API model
 */
export interface IssueScreenshotApiModel {
	id: number;
	issueId: number;
	storagePath: string;
	storageType: string;
	mimeType: string | null;
	width: number | null;
	height: number | null;
	fileSize: number | null;
	elementSelector: {
		cssSelector: string;
		xpath: string;
		boundingBox: { x: number; y: number; width: number; height: number };
		outerHTML: string;
	} | null;
	createdAt: string;
	url?: string; // Signed URL
}

/**
 * Issue Log API model
 */
export interface IssueLogApiModel {
	id: number;
	issueId: number;
	logType: string;
	level: string | null;
	message: string;
	stack: string | null;
	timestamp: string;
	createdAt: string;
	metadata: any | null;
}

/**
 * Issue Comment API model
 */
export interface IssueCommentApiModel {
	id: number;
	issueId: number;
	userId: number;
	content: string;
	createdAt: string;
	updatedAt: string;
	user: {
		id: number;
		name: string | null;
		email: string | null;
	};
}

/**
 * Issue (client-side, with Date objects)
 */
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Issue {
	id: number;
	projectId: number;
	title: string;
	description: string | null;
	severity: IssueSeverity;
	status: IssueStatus;
	assigneeId: number | null;
	reporterInfo: {
		id?: string;
		email?: string;
		name?: string;
	} | null;
	metadata: {
		url: string;
		userAgent: string;
		viewport: { width: number; height: number };
		screen: { width: number; height: number };
		language: string;
		timezone: string;
		timestamp: string;
	} | null;
	createdAt: Date;
	updatedAt: Date;
	screenshots: IssueScreenshot[];
	logs: IssueLog[];
	comments?: IssueComment[];
	project?: {
		id: number;
		name: string;
		publicKey: string;
	};
	assignee?: {
		id: number;
		name: string | null;
		email: string | null;
	} | null;
}

/**
 * Issue Screenshot (client-side)
 */
export interface IssueScreenshot {
	id: number;
	issueId: number;
	storagePath: string;
	storageType: string;
	mimeType: string | null;
	width: number | null;
	height: number | null;
	fileSize: number | null;
	elementSelector: {
		cssSelector: string;
		xpath: string;
		boundingBox: { x: number; y: number; width: number; height: number };
		outerHTML: string;
	} | null;
	createdAt: Date;
	url?: string; // Signed URL
}

/**
 * Issue Log (client-side)
 */
export interface IssueLog {
	id: number;
	issueId: number;
	logType: 'console' | 'error' | 'network';
	level: 'log' | 'warn' | 'error' | null;
	message: string;
	stack: string | null;
	timestamp: Date;
	createdAt: Date;
	metadata: any | null;
}

/**
 * Issue Comment (client-side)
 */
export interface IssueComment {
	id: number;
	issueId: number;
	userId: number;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	user: {
		id: number;
		name: string | null;
		email: string | null;
	};
}

/**
 * Issue list query parameters
 */
export interface IssueListQueryParams {
	page?: number;
	limit?: number;
	projectId?: number;
	status?: IssueStatus | 'all';
	severity?: IssueSeverity | 'all';
	assigneeId?: number | null;
	startDate?: string;  // ISO date string
	endDate?: string;    // ISO date string
	search?: string;
	sortBy?: 'createdAt' | 'updatedAt' | 'severity' | 'status';
	sortOrder?: 'asc' | 'desc';
}

/**
 * Issue pagination
 */
export interface IssuePagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

/**
 * Issue list API response
 */
export type IssueListApiResponse = ApiSuccessResponse<{
	data: IssueApiModel[];
	pagination: IssuePagination;
}>;

/**
 * Issue API response
 */
export type IssueApiResponse = ApiSuccessResponse<IssueApiModel>;

/**
 * Issue form data (for updates)
 * Note: Backend only accepts status, assigneeId, and description
 */
export interface IssueFormData {
	description?: string;
	status?: IssueStatus;
	assigneeId?: number | null;
}

/**
 * Update issue payload
 * Note: Backend only accepts status, assigneeId, and description
 */
export interface UpdateIssuePayload {
	description?: string;
	status?: 'open' | 'in-progress' | 'in_progress' | 'resolved' | 'closed'; // Backend uses hyphens, but we accept both for mapping
	assigneeId?: number | null;
}

/**
 * Add comment payload
 */
export interface AddCommentPayload {
	content: string;
}

/**
 * Comment API response
 */
export type IssueCommentApiResponse = ApiSuccessResponse<IssueCommentApiModel>;

// Local API success response shape used by admin app
export interface ApiSuccessResponse<T> {
	data: T;
	message: string;
	status: number;
}


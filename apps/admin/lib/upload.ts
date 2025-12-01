import { getApiUrl } from '@/lib/api/getApiUrl'

const stripTrailingSlash = (url: string) => url.replace(/\/$/, "")

export const getTempUploadEndpoint = (): string => {
	// Check environment variables first
	const candidates = [
		process.env.NEXT_PUBLIC_UPLOAD_API_URL,
		process.env.NEXT_PUBLIC_API_URL,
		process.env.NEXT_PUBLIC_API_BASE_URL,
	]

	const envBase = candidates.find(
		(candidate) => typeof candidate === "string" && candidate.trim().length > 0
	)?.trim()

	if (envBase) {
		return `${stripTrailingSlash(envBase)}/api/upload/temp`
	}

	// Use utility function for consistent API URL handling
	return getApiUrl('/api/upload/temp')
}


const stripTrailingSlash = (url: string) => url.replace(/\/$/, "")

export const getTempUploadEndpoint = (): string => {
	const candidates = [
		process.env.NEXT_PUBLIC_UPLOAD_API_URL,
		process.env.NEXT_PUBLIC_API_URL,
		process.env.NEXT_PUBLIC_API_BASE_URL,
	]

	const resolvedBase =
		candidates.find((candidate) => typeof candidate === "string" && candidate.trim().length > 0)?.trim() ||
		"http://localhost:3000"

	return `${stripTrailingSlash(resolvedBase)}/api/upload/temp`
}


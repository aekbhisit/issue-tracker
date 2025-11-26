/**
 * @module Image Utilities
 * @description Utility functions for image URL handling
 */

export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null
  
  // ถ้าเป็น URL อยู่แล้ว
  if (imagePath.startsWith('http')) {
    return imagePath
  }

  if (imagePath.startsWith('@modules/')) {
    return `/storage/uploads/modules/${imagePath.replace('@modules/', '')}`
  }
  
  // Always use local path - Next.js will rewrite to API server
  return imagePath
}

export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isLocalPath(path: string | null | undefined): boolean {
  if (!path) return false
  return path.startsWith('/storage/') || path.startsWith('@temp/')
}

export function getPlaceholderImage(): string {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA2NCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxNkwyOCAyNEwzNiAxNkg0NEM0Ni4yMDkxIDE2IDQ4IDE3Ljc5MDkgNDggMjBWMzJDNDggMzQuMjA5MSA0Ni4yMDkxIDM2IDQ0IDM2SDIwQzE3Ljc5MDkgMzYgMTYgMzQuMjA5MSAxNiAzMlYyMEMxNiAxNy43OTA5IDE3Ljc5MDkgMTYgMjAgMTZaIiBmaWxsPSIjOUNBM0FGIi8+CjxjaXJjbGUgY3g9IjI0IiBjeT0iMjIiIHI9IjIiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+'
}

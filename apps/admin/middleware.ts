import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // CRITICAL: With basePath='/admin' and file structure app/admin/...
  // Next.js creates routes like /admin/admin/dashboard (basePath + folder structure)
  // We need to rewrite /admin/dashboard to /admin/admin/dashboard internally
  // OR redirect /admin/admin/* to /admin/*
  
  // Handle double /admin/admin prefix - redirect to single /admin
  if (pathname.startsWith('/admin/admin/')) {
    const correctedPath = pathname.replace(/^\/admin\/admin/, '/admin')
    const url = request.nextUrl.clone()
    url.pathname = correctedPath
    return NextResponse.redirect(url)
  }
  
  // Also handle /admin/admin (without trailing slash)
  if (pathname === '/admin/admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }
  
  // Normalize pathname for internal checks
  // With basePath='/admin', Next.js strips basePath in middleware
  // So /admin/dashboard becomes '/dashboard' in middleware pathname
  // But with app/admin/ structure, it becomes '/admin/dashboard' (folder structure)
  let normalizedPath = pathname
  
  // Remove /admin prefix if present (from folder structure, not basePath)
  if (normalizedPath.startsWith('/admin/')) {
    normalizedPath = normalizedPath.substring('/admin'.length) || '/'
  } else if (normalizedPath === '/admin') {
    normalizedPath = '/'
  }
  
  const token = request.cookies.get('admin_token')?.value
  
  // Login page: '' or '/' (with basePath stripped)
  const isLoginPage = normalizedPath === '' || normalizedPath === '/'
  
  // Dashboard path: '/dashboard' (with /admin prefix removed)
  const isDashboardPath = normalizedPath.startsWith('/dashboard')

  // Only redirect to dashboard if we have a token AND we're on login page
  // BUT: Don't redirect if token might be invalid - let client-side handle validation
  // This prevents redirect loops when token is expired/invalid
  // The client-side will handle redirecting authenticated users after token validation
  if (token && isLoginPage) {
    // Allow the page to load - client-side will validate token and redirect if valid
    // This prevents loops when token is invalid
    return NextResponse.next()
  }

  // Redirect to login if no token and trying to access protected routes
  if (!token && isDashboardPath) {
    // Use basePath-aware redirect: '' becomes '/admin' in browser
    const url = request.nextUrl.clone()
    url.pathname = '' // Empty pathname with basePath='/admin' becomes '/admin'
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

// Configure which paths the middleware should run on
// CRITICAL: With basePath='/admin', Next.js strips the basePath from pathname in middleware
// So '/admin/dashboard' becomes '/dashboard' in middleware
// The matcher should match the actual file routes (without basePath prefix)
// Since all routes are under app/admin/, they become /admin/* in URLs (with basePath)
// But in middleware, basePath is stripped, so we match the routes as they appear in the file structure
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}


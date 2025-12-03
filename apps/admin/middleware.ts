import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // NOTE: With basePath='/admin', Next.js automatically strips basePath from pathname in middleware
  // So '/admin/dashboard' becomes '/dashboard' in middleware
  // But we still need to handle cases where pathname might include /admin prefix
  let normalizedPath = pathname
  
  // Remove /admin prefix if present (Next.js should do this automatically with basePath, but handle both cases)
  if (normalizedPath.startsWith('/admin/')) {
    normalizedPath = normalizedPath.substring('/admin'.length) || '/'
  } else if (normalizedPath === '/admin') {
    normalizedPath = '/'
  }
  
  const token = request.cookies.get('admin_token')?.value
  
  // Login page: '' or '/' (after removing /admin prefix)
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
    // With basePath='/admin', redirect to /admin (login page)
    // Next.js will automatically add basePath prefix
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

// Configure which paths the middleware should run on
// NOTE: With basePath='/admin', Next.js automatically strips basePath from pathname in middleware
// Nginx proxies /admin/* to Next.js, Next.js strips basePath, so pathname in middleware is /dashboard, etc.
// Middleware matches all paths except static files and API routes
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


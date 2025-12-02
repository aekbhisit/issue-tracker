import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('admin_token')?.value
  const isLoginPage = pathname === '/admin' || pathname === '/admin/'
  const isDashboardPath = pathname.startsWith('/admin/dashboard')

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
    return NextResponse.redirect(new URL('/admin', request.url))
  }
  
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/admin/:path*'
  ]
}


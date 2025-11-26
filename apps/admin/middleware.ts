import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('admin_token')?.value
  const isLoginPage = pathname === '/admin' || pathname === '/admin/'
  const isDashboardPath = pathname.startsWith('/admin/dashboard')

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

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


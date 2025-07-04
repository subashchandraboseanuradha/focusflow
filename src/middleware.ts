import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()

  const publicPaths = ['/auth/login', '/auth/signup', '/update-password', '/auth/callback']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (session) {
    // User is authenticated
    if (isPublicPath) {
      // If authenticated user tries to access login/signup/update-password, redirect to home
      return NextResponse.redirect(new URL('/', request.url))
    }
  } else {
    // User is not authenticated
    if (!isPublicPath && !request.nextUrl.pathname.startsWith('/_next/static') && !request.nextUrl.pathname.startsWith('/favicon.ico')) {
      // If unauthenticated user tries to access a protected route, redirect to login
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any other static assets in the public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const PUBLIC_PATHS = ['/auth', '/splash', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is public
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // We don't need to set cookies in middleware
        },
        remove(name: string, options: any) {
          // We don't need to remove cookies in middleware
        },
      },
    }
  )

  // Get session
  const { data: { session } } = await supabase.auth.getSession()

  // Handle domain-specific routing for bandpracticecrm.com
  if (request.headers.get('host') === 'bandpracticecrm.com' && pathname === '/') {
    return NextResponse.redirect(new URL(session ? '/dashboard' : '/splash', request.url))
  }

  // Allow access to public paths regardless of auth status
  if (isPublicPath) {
    return NextResponse.next()
  }

  // If no session and trying to access protected route, redirect to splash
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/splash', request.url))
  }

  // If we have a session and trying to access splash, redirect to dashboard
  if (session && pathname === '/splash') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // For all other cases, continue with the request
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 
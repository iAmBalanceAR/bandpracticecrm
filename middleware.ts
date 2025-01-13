import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that don't need auth checking
const PUBLIC_PATHS = [
  '/auth',
  '/splash',
  '/api',
  '/_next',
  '/images',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
]

// Check if the path is public
const isPublicPath = (path: string) =>
  PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath))

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }
  
  // Check if we're in production by looking at the hostname
  const isLocalhost = request.headers.get('host')?.includes('localhost') || 
                     request.headers.get('host')?.includes('127.0.0.1')
  
  // Redirect root to splash in production
  if (!isLocalhost && pathname === '/') {
    return NextResponse.redirect(new URL('/splash', request.url))
  }

  // Only proceed with auth check for protected routes
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Only check session for HTML requests (not API, assets, etc)
    const acceptHeader = request.headers.get('accept')
    if (acceptHeader?.includes('text/html')) {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Redirect to login if no session
      if (!session) {
        return NextResponse.redirect(new URL('/auth/signin', request.url))
      }
    }
  } catch (error) {
    // Log error but don't break the request
    console.error('Middleware auth error:', error)
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/(dashboard|account|reporting|admin|gigs|venues|bands)/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
} 
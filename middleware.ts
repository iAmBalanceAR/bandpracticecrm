import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = [
  '/dashboard',
  '/account',
  '/members',
  '/bands',
  '/calendar',
  '/messages',
  '/settings'
  // Add any other paths that require subscription
]

const publicPaths = [
  '/auth/signin',
  '/auth/signup',
  '/auth/callback',
  '/auth/reset-password',
  '/auth/forgot-password',
  '/auth/confirm',
  '/api/auth',
  '/api/sync-subscription',
  '/api/create-profile',
  '/pricing',  // Main pricing page
  '/pricing/success',  // Add success page
  '/pricing/cancelled',  // Add cancelled page
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/help',
  '/faq',
  '/favicon.ico',
  '/_next',
  '/static',
  '/images',
  '/robots.txt',
  '/sitemap.xml',
  '/'
]

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()

  // Create a Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Check if the path is in the public paths list
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  )

  // If it's a public path, allow access
  if (isPublicPath) {
    return res
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session and trying to access protected route, redirect to login
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // For protected paths, check subscription
    if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()

      // If no active subscription, redirect to pricing
      if (!profile?.subscription_status || profile.subscription_status !== 'active') {
        return NextResponse.redirect(new URL('/pricing', request.url))
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 
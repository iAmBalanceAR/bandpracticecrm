import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Cache duration in milliseconds (5 seconds)
const CACHE_DURATION = 5000;

// Separate caches for different types of auth data
const sessionCache = new Map<string, { data: any; timestamp: number }>();
const userCache = new Map<string, { data: any; timestamp: number }>();
const subscriptionCache = new Map<string, { data: any; timestamp: number }>();

const protectedPaths = [
  '/',
  '/dashboard',
  '/account',
  '/members',
  '/bands',
  '/calendar',
  '/messages',
  '/settings',
  // Add any other paths that require subscription
]

const publicPaths = [
  '/auth/signin',
  '/auth/signup',
  '/auth/callback',
  '/auth/callback?code=*',  // Allow callback with code parameter
  '/auth/callback?token_hash=*',  // Allow callback with token_hash parameter
  '/auth/auth-code-error',  // Add error page
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
  '/api/checkout',
  '/account/password',
  '/account/password/reset',  // Add standalone reset page
  '/account/password/reset?code=*',  // Allow reset page with code parameter
  '/auth/auth-code-error?error=*',  // Allow error page with error parameter
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()

  // Check if the path is in the public paths list
  const isPublicPath = publicPaths.some(path => {
    // Handle paths with wildcards for query parameters
    if (path.includes('*')) {
      const [basePath, paramPattern] = path.split('?')
      const currentPath = request.nextUrl.pathname
      const currentSearch = request.nextUrl.search

      // If the path matches and there's no query pattern, it's a match
      if (currentPath === basePath && !paramPattern) {
        return true
      }

      // If there's a query pattern, check if the current URL matches the pattern
      if (paramPattern && currentSearch) {
        const paramName = paramPattern.split('=')[0]
        return currentPath === basePath && currentSearch.startsWith(`?${paramName}=`)
      }

      return false
    }

    // Regular path matching
    return request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  })

  // If it's a public path, allow access immediately
  if (isPublicPath) {
    return response
  }

  // Create a unique key for this request
  const sessionToken = request.cookies.get('sb-xasfpbzzvsgzvdpjqwqe-auth-token')?.value;
  const cacheKey = sessionToken || request.url;

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
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // Check session cache first
    const cachedSession = sessionCache.get(cacheKey);
    let session;
    
    if (cachedSession && Date.now() - cachedSession.timestamp < CACHE_DURATION) {
      session = cachedSession.data;
    } else {
      const { data: { session: newSession } } = await supabase.auth.getSession();
      session = newSession;
      sessionCache.set(cacheKey, { 
        data: newSession, 
        timestamp: Date.now() 
      });
    }

    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Check user cache
    const cachedUser = userCache.get(cacheKey);
    let user;

    if (cachedUser && Date.now() - cachedUser.timestamp < CACHE_DURATION) {
      user = cachedUser.data;
    } else {
      const { data: { user: newUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !newUser) {
        return NextResponse.redirect(new URL('/auth/signin', request.url))
      }
      user = newUser;
      userCache.set(cacheKey, {
        data: newUser,
        timestamp: Date.now()
      });
    }

    // For protected paths, check subscription
    if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
      const cachedSubscription = subscriptionCache.get(user.id);
      let profile;

      if (cachedSubscription && Date.now() - cachedSubscription.timestamp < CACHE_DURATION) {
        profile = cachedSubscription.data;
      } else {
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', user.id)
          .single();
        
        profile = newProfile;
        subscriptionCache.set(user.id, {
          data: newProfile,
          timestamp: Date.now()
        });
      }

      if (!profile?.subscription_status || profile.subscription_status !== 'active') {
        return NextResponse.redirect(new URL('/pricing', request.url))
      }
    }

    return response

  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  [sessionCache, userCache, subscriptionCache].forEach(cache => {
    Array.from(cache.entries()).forEach(([key, value]) => {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
      }
    });
  });
}, CACHE_DURATION);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 
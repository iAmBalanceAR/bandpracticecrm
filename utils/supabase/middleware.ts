import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Skip auth check for public routes
  if (request.nextUrl.pathname.startsWith('/_next') || 
      request.nextUrl.pathname.startsWith('/api/') ||
      request.nextUrl.pathname.startsWith('/static') ||
      request.nextUrl.pathname.startsWith('/auth/') ||
      request.nextUrl.pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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
      auth: {
        detectSessionInUrl: true,
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
      }
    }
  )

  try {
    await supabase.auth.getSession()
    return response
  } catch (error) {
    // If we hit rate limit, wait briefly and retry once
    if (error instanceof Error && error.message.includes('rate limit')) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      try {
        await supabase.auth.getSession()
        return response
      } catch (retryError) {
        console.error('Rate limit retry failed:', retryError)
      }
    }
    return response
  }
} 
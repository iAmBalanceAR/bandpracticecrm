import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Debug logging
  console.log('Middleware executing for path:', request.nextUrl.pathname)
  console.log('Host:', request.headers.get('host'))
  
  // Check if we're in production by looking at the hostname
  const isLocalhost = request.headers.get('host')?.includes('localhost') || request.headers.get('host')?.includes('127.0.0.1')
  console.log('isLocalhost:', isLocalhost)
  
  if (!isLocalhost && request.nextUrl.pathname === '/') {
    console.log('Attempting to redirect to splash page')
    return NextResponse.redirect(new URL('/splash', request.url))
  }

  // Skip auth check for auth-related routes and splash page
  if (request.nextUrl.pathname.startsWith('/auth/') || request.nextUrl.pathname.startsWith('/splash')) {
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

  await supabase.auth.getSession()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 
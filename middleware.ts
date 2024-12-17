import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      throw userError
    }

    // Protected routes
    if (req.nextUrl.pathname.startsWith('/dashboard') || 
        req.nextUrl.pathname.startsWith('/account')) {
      if (!user) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }

      // Check subscription status for premium routes
      if (req.nextUrl.pathname.startsWith('/dashboard/premium')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', user.id)
          .single()

        if (!profile?.subscription_status || 
            !['active', 'trialing'].includes(profile.subscription_status)) {
          return NextResponse.redirect(new URL('/pricing', req.url))
        }
      }
    }

    // Auth routes - redirect to dashboard if already logged in
    if (req.nextUrl.pathname.startsWith('/auth') && user) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  } catch (error) {
    console.error('Auth error:', error)
    // On auth error, redirect to sign in
    if (req.nextUrl.pathname.startsWith('/dashboard') || 
        req.nextUrl.pathname.startsWith('/account')) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*', '/auth/:path*'],
} 
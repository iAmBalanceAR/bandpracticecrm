import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const TokenHash = requestUrl.searchParams.get('TokenHash')
  const type = requestUrl.searchParams.get('type')
  const email = requestUrl.searchParams.get('email')
  const next = requestUrl.searchParams.get('next') || '/'

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    // Handle PKCE flow with code
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(new URL(next, request.url))
      }
      throw error
    }

    // Handle email verification with TokenHash
    if (TokenHash && type === 'signup' && email) {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: TokenHash,
        type: 'signup'
      })
      if (!error) {
        return NextResponse.redirect(new URL(next, request.url))
      }
      throw error
    }

    throw new Error('No code or token found')
  } catch (error) {
    // Log the error for debugging
    console.error('Auth callback error:', error)
    
    // Return the user to an error page with instructions
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
  }
} 
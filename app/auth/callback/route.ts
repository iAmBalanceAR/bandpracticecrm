import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') ?? '/'
  
  // Get any error parameters from the URL
  const error = requestUrl.searchParams.get('error')
  const error_code = requestUrl.searchParams.get('error_code')
  const error_description = requestUrl.searchParams.get('error_description')

  // If we have error parameters in the URL, preserve them in the redirect
  if (error || error_code || error_description) {
    const errorUrl = new URL('/auth/signin', request.url)
    if (error) errorUrl.searchParams.set('error', error)
    if (error_code) errorUrl.searchParams.set('error_code', error_code)
    if (error_description) errorUrl.searchParams.set('error_description', error_description)
    return NextResponse.redirect(errorUrl)
  }

  console.log('Callback params:', { code, token_hash, type, next })

  const cookieStore = cookies()
  const codeVerifier = cookieStore.get('sb-xasfpbzzvsgzvdpjqwqe-auth-token-code-verifier')?.value

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            console.log('Setting cookie:', { name, value, options })
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Handle password reset code
    if (code) {
      console.log('Processing password reset code')
      const { data, error: resetError } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('Exchange result:', { 
        success: !resetError, 
        error: resetError?.message,
        hasSession: !!data?.session,
        userId: data?.session?.user?.id
      })

      if (resetError) {
        console.error('Password reset code error:', resetError.message)
        const errorUrl = new URL('/auth/signin', request.url)
        errorUrl.searchParams.set('error', 'reset_code_invalid')
        errorUrl.searchParams.set('error_description', resetError.message)
        return NextResponse.redirect(errorUrl)
      }

      // Verify we got a session
      if (!data?.session) {
        console.error('No session established after code exchange')
        const errorUrl = new URL('/auth/signin', request.url)
        errorUrl.searchParams.set('error', 'no_session')
        errorUrl.searchParams.set('error_description', 'Failed to establish a session')
        return NextResponse.redirect(errorUrl)
      }

      console.log('Successfully established session, redirecting to password reset')
      return NextResponse.redirect(new URL('/account/password/reset', request.url))
    }

    // Handle email verification
    if (!token_hash || !codeVerifier) {
      console.error('Missing token_hash or code verifier')
      const errorUrl = new URL('/auth/signin', request.url)
      errorUrl.searchParams.set('error', 'missing_verification')
      errorUrl.searchParams.set('error_description', 'Missing verification tokens')
      return NextResponse.redirect(errorUrl)
    }

    // Exchange the code for a session using the code verifier
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email'
    })

    if (error) {
      console.error('Verification error:', error.message)
      const errorUrl = new URL('/auth/signin', request.url)
      errorUrl.searchParams.set('error', 'verification_failed')
      errorUrl.searchParams.set('error_description', error.message)
      return NextResponse.redirect(errorUrl)
    }

    // Successful verification
    return NextResponse.redirect(new URL('/pricing', request.url))

  } catch (err: any) {
    console.error('Unexpected error during verification:', err)
    const errorUrl = new URL('/auth/signin', request.url)
    errorUrl.searchParams.set('error', 'unexpected')
    errorUrl.searchParams.set('error_description', err.message)
    return NextResponse.redirect(errorUrl)
  }
} 
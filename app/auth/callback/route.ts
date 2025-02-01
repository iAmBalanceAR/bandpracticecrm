import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') ?? '/'

  const cookieStore = cookies()
  const codeVerifier = cookieStore.get('sb-xasfpbzzvsgzvdpjqwqe-auth-token-code-verifier')?.value

  if (!token_hash || !codeVerifier) {
    console.error('Missing token_hash or code verifier')
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
  }

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
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Exchange the code for a session using the code verifier
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email'
    })

    if (error) {
      console.error('Verification error:', error.message)
      return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
    }

    // Successful verification
    return NextResponse.redirect(new URL('/pricing', request.url))

  } catch (err) {
    console.error('Unexpected error during verification:', err)
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
  }
} 
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  if (request.headers.get('host') === 'bandpracticecrm.com') {
    const session = request.cookies.get('supabase-auth-token')
    return NextResponse.redirect(new URL(session ? '/dashboard' : '/splash', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/'
} 
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // These need to be handled in a server action or API route
        set(name: string, value: string, options: CookieOptions) {
          return // Do nothing on direct calls
        },
        remove(name: string, options: CookieOptions) {
          return // Do nothing on direct calls
        },
      },
    }
  )
}

export default createClient 
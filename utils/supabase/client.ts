import { createBrowserClient } from '@supabase/ssr'

// Suppress specific Supabase warning
const originalWarn = console.warn
console.warn = function filterWarning(...args) {
  if (typeof args[0] === 'string' && args[0].includes('Using the user object as returned from supabase.auth.getSession()')) {
    return
  }
  originalWarn.apply(console, args)
}

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export default createClient 
'use server'

import { cookies } from 'next/headers'
import { type CookieOptions } from '@supabase/ssr'

export async function setCookie(name: string, value: string, options: CookieOptions) {
  cookies().set(name, value, options)
}

export async function removeCookie(name: string, options: CookieOptions) {
  cookies().set(name, '', { ...options, maxAge: 0 })
} 
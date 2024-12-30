import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './supabase'

export type { Database }

export type TypedSupabaseClient = ReturnType<typeof createBrowserClient<Database>> 
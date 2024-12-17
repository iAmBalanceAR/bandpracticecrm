import { createClientComponentClient as createClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export const createClientComponentClient = () => {
  return createClient<Database>()
}

export default createClientComponentClient 
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export async function searchVenues(searchTerm: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('venues')
    .select(`
      id,
      title,
      address,
      address2,
      city,
      state,
      zip
    `)
    .ilike('title', `%${searchTerm}%`)
    .limit(10)

  if (error) {
    console.error('Error searching venues:', error)
    return []
  }

  return data
}

export default createClient 
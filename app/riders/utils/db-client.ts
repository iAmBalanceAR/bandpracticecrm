import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function listAvailableStagePlots() {
  const { data: stagePlots, error } = await supabase
    .from('stage_plots')
    .select('id, name')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching stage plots:', error)
    return []
  }

  return stagePlots
}

export async function listAvailableSetlists() {
  const { data: setlists, error } = await supabase
    .from('setlists')
    .select('id, title')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching setlists:', error)
    return []
  }

  return setlists
}
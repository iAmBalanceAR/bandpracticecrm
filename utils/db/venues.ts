import createClient from '@/utils/supabase/client'

export interface Venue {
  id: string
  title: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  created_at?: string
}

export async function searchVenues(query: string): Promise<Venue[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .ilike('title', `%${query}%`)
    .order('created_at', { ascending: true })
    .limit(10)

  if (error) {
    console.error('Error searching venues:', error)
    return []
  }

  // Deduplicate venues by title
  const uniqueVenues = new Map<string, Venue>()
  data?.forEach((venue: Venue) => {
    const normalizedTitle = venue.title.toLowerCase().trim()
    if (!uniqueVenues.has(normalizedTitle)) {
      uniqueVenues.set(normalizedTitle, venue)
    } else {
      // If we find a duplicate with more complete data, use that one instead
      const existing = uniqueVenues.get(normalizedTitle)!
      const merged = {
        ...existing,
        address: existing.address || venue.address,
        city: existing.city || venue.city,
        state: existing.state || venue.state,
        zip: existing.zip || venue.zip,
      }
      uniqueVenues.set(normalizedTitle, merged)
    }
  })

  return Array.from(uniqueVenues.values())
} 
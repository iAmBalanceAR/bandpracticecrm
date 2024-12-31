'use server'

import { createClient } from '@/utils/supabase/server'

interface Venue {
  id: string
  title: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  created_at?: string
}

export async function cleanupVenues() {
  const supabase = createClient()
  
  const { data: venues, error } = await supabase
    .from('venues')
    .select('*')
    .order('created_at', { ascending: true })

  if (error || !venues) {
    console.error('Error fetching venues:', error)
    throw new Error('Failed to fetch venues')
  }

  // Group venues by normalized title
  const venueGroups = venues.reduce((acc, venue) => {
    const normalizedTitle = venue.title.toLowerCase().trim()
    if (!acc[normalizedTitle]) {
      acc[normalizedTitle] = []
    }
    acc[normalizedTitle].push(venue)
    return acc
  }, {} as Record<string, Venue[]>)

  let cleanedCount = 0

  // Process each group of duplicates
  for (const [_, dupeGroup] of Object.entries(venueGroups)) {
    const dupes = dupeGroup as Venue[]
    if (dupes.length > 1) {
      cleanedCount += dupes.length - 1
      // ... rest of the cleanup logic
    }
  }

  return cleanedCount
} 
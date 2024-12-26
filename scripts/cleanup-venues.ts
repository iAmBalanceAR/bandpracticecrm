import { createClient } from '@supabase/supabase-js'
import type { Venue } from '@/utils/db/venues'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function cleanupDuplicateVenues() {
  let totalCleaned = 0
  let totalVenuesChecked = 0
  let allVenues: Venue[] = []
  
  console.log('\n🔍 Starting venue cleanup...')
  
  let page = 0
  const pageSize = 1000
  let hasMore = true
  
  while (hasMore) {
    const { data, error, count } = await supabase
      .from('venues')
      .select('*', { count: 'exact' })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('❌ Error fetching venues:', error)
      return 0
    }

    if (!data || data.length === 0) {
      hasMore = false
      break
    }

    allVenues = [...allVenues, ...data]
    console.log(`📥 Fetched ${data.length} venues (total: ${allVenues.length}${count ? `/${count}` : ''})`)
    
    // Check if we've reached the end
    if (count && allVenues.length >= count) {
      hasMore = false
    }
    
    page++
    
    // Safety check - if we've fetched more than 100k venues, something might be wrong
    if (allVenues.length > 100000) {
      console.error('❌ Safety limit reached - too many venues')
      return 0
    }
  }

  console.log(`\n📊 Found ${allVenues.length.toLocaleString()} total venues`)

  // Group venues by normalized title
  const venueGroups = allVenues.reduce<Record<string, Venue[]>>((acc: Record<string, Venue[]>, venue: Venue) => {
    const normalizedTitle = venue.title.toLowerCase().trim()
    if (!acc[normalizedTitle]) {
      acc[normalizedTitle] = []
    }
    acc[normalizedTitle].push(venue)
    return acc
  }, {})

  console.log(`\n📝 Found ${Object.keys(venueGroups).length} unique venue names`)

  for (const [title, dupes] of Object.entries(venueGroups)) {
    totalVenuesChecked++
    if (dupes.length > 1) {
      console.log(`\n🔄 Processing "${title}" - Found ${dupes.length} duplicates`)
      
      // Merge data from all duplicates into the first (oldest) record
      const mergedVenue = dupes.reduce((merged: Venue, current: Venue) => ({
        ...merged,
        address: merged.address || current.address,
        city: merged.city || current.city,
        state: merged.state || current.state,
        zip: merged.zip || current.zip,
      }))

      // Update the first venue with merged data
      const { error: updateError } = await supabase
        .from('venues')
        .update({
          address: mergedVenue.address,
          city: mergedVenue.city,
          state: mergedVenue.state,
          zip: mergedVenue.zip,
        })
        .eq('id', dupes[0].id)

      if (updateError) {
        console.error(`❌ Error updating venue "${title}":`, updateError)
        continue
      }

      // Delete the duplicates
      const duplicateIds = dupes.slice(1).map((d: Venue) => d.id)
      const { error: deleteError } = await supabase
        .from('venues')
        .delete()
        .in('id', duplicateIds)

      if (deleteError) {
        console.error(`❌ Error deleting duplicates for "${title}":`, deleteError)
      } else {
        totalCleaned += duplicateIds.length
        console.log(`✅ Merged and deleted ${duplicateIds.length} duplicates for "${title}"`)
      }
    } else {
      console.log(`✨ "${title}" - No duplicates found`)
    }
  }

  console.log(`\n🎉 Cleanup complete!`)
  console.log(`📊 Checked ${totalVenuesChecked} venues`)
  console.log(`🧹 Cleaned up ${totalCleaned} duplicates\n`)
  return totalCleaned
}

// Add this to run the script directly
if (require.main === module) {
  cleanupDuplicateVenues()
    .then((count) => process.exit(0))
    .catch((error) => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
}
  
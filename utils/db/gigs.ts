import createClient from '@/utils/supabase/client'
import { type Database } from '@/types/supabase'

export interface Gig {
  id: string
  title: string
  venue: string
  venue_address: string
  venue_city: string
  venue_state: string
  venue_zip: string
  contact_name: string
  contact_email: string
  contact_phone: string
  gig_date: string
  load_in_time: string
  sound_check_time: string
  set_time: string
  set_length: string
  gig_details: string | null
  crew_hands_in: boolean
  crew_hands_out: boolean
  meal_included: boolean
  hotel_included: boolean
  deposit_amount: number
  deposit_paid: boolean
  contract_total: number
  open_balance: number
  gig_status: GigStatus
}
export type NewGig = Database['public']['Tables']['gigs']['Insert']
export type GigStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface GigFormData {
  title: string
  venue: string
  venue_address: string
  venue_city: string
  venue_state: string
  venue_zip: string
  contact_name: string
  contact_email: string
  contact_phone: string
  gig_date: string
  load_in_time: string
  sound_check_time: string
  set_time: string
  set_length: string
  gig_details: string | null
  crew_hands_in: boolean
  crew_hands_out: boolean
  meal_included: boolean
  hotel_included: boolean
  deposit_amount: number
  deposit_paid: boolean
  contract_total: number
  open_balance: number
  gig_status?: GigStatus
}

export const gigHelpers = {
  async getGigs() {
    const supabase = createClient()
    const { data: gigs, error } = await supabase
      .from('gigs')
      .select('*')
      .order('gig_date', { ascending: true })

    if (error) {
      console.error('Error fetching gigs:', error)
      throw error
    }

    return gigs
  },

  async getGig(id: string) {
    const supabase = createClient()
    const { data: gig, error } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching gig:', error)
      throw error
    }

    return gig
  },

  async createGig(gig: GigFormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('gigs')
      .insert([{
        ...gig,
        user_id: user.id,
        gig_status: gig.gig_status || 'pending'
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating gig:', error)
      throw error
    }

    return data
  },

  async updateGig(id: string, gig: Partial<GigFormData>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('gigs')
      .update(gig)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating gig:', error)
      throw error
    }

    return data
  },

  async deleteGig(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('gigs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting gig:', error)
      throw error
    }
  },

  async getGigsWithCoordinates(): Promise<{gigs: Gig[], tourStops: any[]}> {
    const supabase = createClient()
    
    // Get all gigs ordered by date
    const { data: gigs, error: gigsError } = await supabase
      .from('gigs')
      .select('*')
      .order('gig_date', { ascending: true })

    if (gigsError) {
      console.error('Error fetching gigs:', gigsError)
      return { gigs: [], tourStops: [] }
    }

    // For each gig, get venue coordinates
    const tourStops = await Promise.all(gigs.map(async (gig) => {
      // First try to get venue from venues table
      const { data: venueData } = await supabase
        .from('venues')
        .select('latitude, longitude, title')
        .eq('title', gig.venue)
        .single()

      if (venueData?.latitude && venueData?.longitude) {
        return {
          id: gig.id,
          name: gig.venue,
          city: gig.venue_city,
          state: gig.venue_state,
          date: gig.gig_date,
          lat: parseFloat(venueData.latitude),
          lng: parseFloat(venueData.longitude)
        }
      }

      // If venue not found or missing coordinates, geocode the address
      const address = `${gig.venue_address}, ${gig.venue_city}, ${gig.venue_state} ${gig.venue_zip}`
      const params = new URLSearchParams({
        format: 'json',
        q: address,
        addressdetails: '1',
        limit: '1'
      })

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          headers: { 'User-Agent': 'BandPracticeTourManager/1.0' }
        })
        const data = await response.json()

        if (data && data[0]) {
          // Update venue in database with new coordinates
          await supabase
            .from('venues')
            .upsert({
              title: gig.venue,
              address: gig.venue_address,
              city: gig.venue_city,
              state: gig.venue_state,
              zip: gig.venue_zip,
              latitude: data[0].lat,
              longitude: data[0].lon
            })

          return {
            id: gig.id,
            name: gig.venue,
            city: gig.venue_city,
            state: gig.venue_state,
            date: gig.gig_date,
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          }
        }
      } catch (error) {
        console.error('Error geocoding venue:', error)
      }

      return null
    }))

    return {
      gigs,
      tourStops: tourStops.filter(stop => stop !== null)
    }
  }
} 
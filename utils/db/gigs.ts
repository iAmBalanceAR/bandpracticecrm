import createClient from '@/utils/supabase/client'
import { type Database } from '@/types/supabase'

export type GigStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

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
  deposit_amount: number | null
  deposit_paid: boolean
  contract_total: number
  open_balance: number
  payment_amount: number
  payment_status: 'Pending' | 'Paid' | 'Cancelled'
  notes: string | null
  created_at: string
  updated_at: string
  user_id: string
  gig_status: GigStatus
  tours?: {
    id: string
    title: string
  }
}

export type NewGig = Database['public']['Tables']['gigs']['Insert']

export interface TourStop {
  id: string
  name: string
  lat: number
  lng: number
  city: string
  state: string
  address: string
  zip: string
  savedToGigs: boolean
  gig_date: string
}

export const gigHelpers = {
  async getGigs(tourId?: string): Promise<Gig[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    // First get the default tour ID if no specific tourId is provided
    if (!tourId) {
      const { data: defaultTour } = await supabase
        .from('tours')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

      if (defaultTour) {
        tourId = defaultTour.id
      }
    }

    let query = supabase
      .from('gigs')
      .select(`
        *,
        tours:tourconnect(
          tour:tours(
            id,
            title
          )
        )
      `)
      .eq('user_id', user.id)
      .order('gig_date', { ascending: true })

    if (tourId) {
      // Filter by tour through the tourconnect junction table
      query = query.eq('tourconnect.tour_id', tourId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching gigs:', error)
      throw error
    }

    // Ensure all gigs have a tour connection
    for (const gig of data || []) {
      if (!gig.tours?.[0]?.tour) {
        // If no tour connection exists, connect to default tour
        const { error: connectError } = await supabase
          .rpc('connect_gig_to_default_tour', {
            p_gig_id: gig.id
          })

        if (connectError) {
          console.error('Error connecting gig to default tour:', connectError)
        }
      }
    }

    // Transform the data to match the expected interface
    return (data || []).map(gig => ({
      ...gig,
      tours: gig.tours?.[0]?.tour
    }))
  },

  async getGig(id: string): Promise<Gig | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching gig:', error)
      throw error
    }

    return data
  },

  async createGig(gig: Omit<Gig, 'id' | 'created_at' | 'updated_at'>): Promise<Gig> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

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

  async updateGig(id: string, gig: Partial<Omit<Gig, 'id' | 'created_at' | 'updated_at'>>): Promise<Gig> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    const { data, error } = await supabase
      .from('gigs')
      .update(gig)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating gig:', error)
      throw error
    }

    return data
  },

  async deleteGig(id: string): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    const { error } = await supabase
      .from('gigs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting gig:', error)
      throw error
    }
  },

  async getGigsWithCoordinates(tourId?: string): Promise<{ tourStops: TourStop[] }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    let query = supabase
      .from('gigs')
      .select('*')
      .eq('user_id', user.id)
      .order('gig_date', { ascending: true })

    if (tourId) {
      query = query.eq('tour_id', tourId)
    }

    const { data: gigs, error } = await query

    if (error) {
      console.error('Error fetching gigs:', error)
      throw error
    }

    // For each gig, get venue coordinates
    const tourStops = await Promise.all((gigs || []).map(async (gig) => {
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
          address: gig.venue_address,
          zip: gig.venue_zip,
          gig_date: gig.gig_date,
          savedToGigs: true,
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
            address: gig.venue_address,
            zip: gig.venue_zip,
            gig_date: gig.gig_date,
            savedToGigs: true,
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
      tourStops: tourStops.filter((stop): stop is TourStop => stop !== null)
    }
  }
} 
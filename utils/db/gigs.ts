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

    // Always get the default tour ID if no specific tourId is provided
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

    // Get all gigs with their tour connections
    const { data, error } = await supabase
      .from('gigs')
      .select(`
        *,
        tours:tourconnect!inner(
          tour:tours(
            id,
            title,
            is_default
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('tourconnect.tour_id', tourId)
      .order('gig_date', { ascending: true })

    if (error) {
      console.error('Error fetching gigs:', error)
      throw error
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

  async createGig(gig: NewGig): Promise<Gig> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    // First create the gig
    const { data: newGig, error: gigError } = await supabase
      .from('gigs')
      .insert([{
        ...gig,
        user_id: user.id,
        gig_status: gig.gig_status || 'pending'
      }])
      .select()
      .single()

    if (gigError) {
      console.error('Error creating gig:', gigError)
      throw gigError
    }

    // Get the current default tour
    const { data: defaultTour } = await supabase
      .from('tours')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    if (defaultTour) {
      // Connect the gig to the default tour
      const { error: connectError } = await supabase
        .from('tourconnect')
        .insert([{
          gig_id: newGig.id,
          tour_id: defaultTour.id
        }])

      if (connectError) {
        console.error('Error connecting gig to default tour:', connectError)
        // Don't throw here - the gig was created successfully
      }
    }

    return newGig
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

  // Helper function to get coordinates from an address
  async getCoordinates(address: string): Promise<[number, number]> {
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
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      }
    } catch (error) {
      console.error('Error geocoding address:', error)
    }

    return [0, 0] // Return default coordinates if geocoding fails
  },

  async getGigsWithCoordinates(tourId?: string): Promise<{ tourStops: TourStop[] }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    // Always get the default tour ID if no specific tourId is provided
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

    // Get all gigs with their tour connections
    const { data: gigs, error } = await supabase
      .from('gigs')
      .select(`
        *,
        tours:tourconnect!inner(
          tour:tours(
            id,
            title,
            is_default
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('tourconnect.tour_id', tourId)
      .order('gig_date', { ascending: true })

    if (error) {
      console.error('Error fetching gigs:', error)
      throw error
    }

    // Transform gigs into tour stops
    const tourStops: TourStop[] = (gigs || []).map(gig => ({
      id: gig.id,
      name: gig.venue,
      lat: 0, // Will be set by geocoding
      lng: 0, // Will be set by geocoding
      city: gig.venue_city,
      state: gig.venue_state,
      address: gig.venue_address,
      zip: gig.venue_zip,
      savedToGigs: true,
      gig_date: gig.gig_date
    }))

    // Get coordinates for each stop
    for (const stop of tourStops) {
      const coordinates = await this.getCoordinates(
        `${stop.address}, ${stop.city}, ${stop.state} ${stop.zip}`
      )
      stop.lat = coordinates[0]
      stop.lng = coordinates[1]
    }

    return { tourStops }
  }
} 
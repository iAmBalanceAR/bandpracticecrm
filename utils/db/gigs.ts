import createClient from '@/utils/supabase/client'

export type GigStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Gig {
  id: string
  title: string
  venue: string
  venue_address: string
  venue_city: string
  venue_state: string
  venue_zip: string
  gig_date: string
  set_time: string
  set_length: string
  load_in_time: string
  sound_check_time: string
  crew_hands_in: boolean
  crew_hands_out: boolean
  meal_included: boolean
  hotel_included: boolean
  contact_name: string
  contact_phone: string
  contact_email: string
  deposit_amount: number | null
  deposit_paid: boolean
  contract_total: number
  open_balance: number
  gig_details: string | null
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

    const tourStops = await Promise.all((gigs || []).map(async (gig) => {
      const coordinates = await getCoordinates(
        `${gig.venue_address}, ${gig.venue_city}, ${gig.venue_state} ${gig.venue_zip}`
      )

      return {
        id: gig.id,
        name: gig.venue,
        lat: coordinates[0],
        lng: coordinates[1],
        city: gig.venue_city,
        state: gig.venue_state,
        address: gig.venue_address,
        zip: gig.venue_zip,
        savedToGigs: true,
        gig_date: gig.gig_date
      }
    }))

    return { tourStops }
  },

  async createGig(gigData: Partial<Gig>): Promise<Gig> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    const newGig = {
      ...gigData,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Create the gig
    const { data: gig, error: gigError } = await supabase
      .from('gigs')
      .insert([newGig])
      .select()
      .single()

    if (gigError) {
      console.error('Error creating gig:', gigError)
      throw gigError
    }

    // Connect to default tour using the database function
    const { error: connectError } = await supabase
      .rpc('connect_gig_to_default_tour', {
        p_gig_id: gig.id
      })

    if (connectError) {
      console.error('Error connecting gig to default tour:', connectError)
      throw connectError
    }

    return gig
  },

  async updateGig(id: string, gigData: Partial<Gig>): Promise<Gig> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    const updateData = {
      ...gigData,
      updated_at: new Date().toISOString()
    }

    const { data: gig, error: updateError } = await supabase
      .from('gigs')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating gig:', updateError)
      throw updateError
    }

    // Connect to default tour using the database function
    const { error: connectError } = await supabase
      .rpc('connect_gig_to_default_tour', {
        p_gig_id: id
      })

    if (connectError) {
      console.error('Error connecting gig to default tour:', connectError)
      throw connectError
    }

    return gig
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
  }
}

async function getCoordinates(address: string): Promise<[number, number]> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    )
    const data = await response.json()

    if (data && data[0]) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
    }

    console.warn(`No coordinates found for address: ${address}`)
    return [0, 0] // Default coordinates if none found
  } catch (error) {
    console.error('Error fetching coordinates:', error)
    return [0, 0] // Default coordinates on error
  }
} 
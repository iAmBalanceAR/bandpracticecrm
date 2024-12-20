import createClient from '@/utils/supabase/client'
import type { Database } from '@/types/supabase'

export type GigStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Gig {
  id: string
  created_at?: string
  updated_at?: string
  user_id: string
  
  // Basic gig info
  title: string
  gig_status: GigStatus
  gig_date: string
  gig_details?: string
  
  // Venue information
  venue: string
  venue_address: string
  venue_city: string
  venue_state: string
  venue_zip: string
  
  // Contact information
  contact_name: string
  contact_email?: string
  contact_phone?: string
  
  // Times
  load_in_time: string
  sound_check_time: string
  set_time: string
  set_length: string
  
  // Crew and amenities
  crew_hands_in: boolean
  crew_hands_out: boolean
  meal_included: boolean
  hotel_included: boolean
  
  // Financial information
  deposit_amount: number
  deposit_paid: boolean
  contract_total: number
  open_balance: number
}

export const dbHelpers = {
  getGigs: async (): Promise<Gig[]> => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .order('gig_date', { ascending: true })

    if (error) {
      console.error('Error fetching gigs:', error)
      throw error
    }

    return data || []
  },

  getGig: async (id: string): Promise<Gig | null> => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching gig:', error)
      throw error
    }

    return data
  },

  saveGig: async (gig: Partial<Gig>): Promise<Gig> => {
    const supabase = createClient()
    
    // Format dates and times
    const formattedGig = {
      ...gig,
      gig_date: gig.gig_date ? new Date(gig.gig_date).toISOString().split('T')[0] : undefined,
      load_in_time: gig.load_in_time || undefined,
      sound_check_time: gig.sound_check_time || undefined,
      set_time: gig.set_time || undefined,
    }
    
    if (gig.id) {
      // Update existing gig
      const { data, error } = await supabase
        .from('gigs')
        .update(formattedGig)
        .eq('id', gig.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating gig:', error)
        throw error
      }

      return data
    } else {
      // Insert new gig
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const newGig = {
        ...formattedGig,
        user_id: userData.user.id,
        gig_status: 'pending' as GigStatus,
        deposit_amount: formattedGig.deposit_amount || 0,
        contract_total: formattedGig.contract_total || 0,
        open_balance: formattedGig.open_balance || 0,
        crew_hands_in: formattedGig.crew_hands_in || false,
        crew_hands_out: formattedGig.crew_hands_out || false,
        meal_included: formattedGig.meal_included || false,
        hotel_included: formattedGig.hotel_included || false,
      }

      const { data, error } = await supabase
        .from('gigs')
        .insert(newGig)
        .select()
        .single()

      if (error) {
        console.error('Error creating gig:', error)
        throw error
      }

      return data
    }
  },

  deleteGig: async (id: string): Promise<void> => {
    const supabase = createClient()
    const { error } = await supabase
      .from('gigs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting gig:', error)
      throw error
    }
  }
} 
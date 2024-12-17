import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

type GigRow = Database['public']['Tables']['gigs']['Row']
type GigInsert = Database['public']['Tables']['gigs']['Insert']
type GigUpdate = Database['public']['Tables']['gigs']['Update']

export type Gig = GigRow

export const dbHelpers = {
  // Get all gigs for the current user
  getGigs: async (): Promise<Gig[]> => {
    const supabase = createClientComponentClient<Database>()
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

  // Save or update a gig
  saveGig: async (gig: Omit<GigInsert, 'user_id'>) => {
    const supabase = createClientComponentClient<Database>()
    
    // Convert date and time formats to match database schema
    const formattedGig: GigInsert = {
      title: gig.title,
      gig_date: gig.gig_date,
      venue: gig.venue || '',
      venue_address: gig.venue_address || '',
      venue_city: gig.venue_city || '',
      venue_state: gig.venue_state || '',
      venue_zip: gig.venue_zip || '',
      contact_name: gig.contact_name || '',
      contact_email: gig.contact_email || '',
      contact_phone: gig.contact_phone || '',
      load_in_time: gig.load_in_time || '',
      set_time: gig.set_time || '',
      set_length: gig.set_length || '',
      gig_details: gig.gig_details || '',
      meal_included: gig.meal_included || false,
      hotel_included: gig.hotel_included || false,
      deposit_amount: gig.deposit_amount || 0,
      deposit_paid: gig.deposit_paid || false,
      total_payout: gig.total_payout || 0,
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
      const { data, error } = await supabase
        .from('gigs')
        .insert(formattedGig)
        .select()
        .single()

      if (error) {
        console.error('Error creating gig:', error)
        throw error
      }

      return data
    }
  },

  // Delete a gig
  deleteGig: async (id: string) => {
    const supabase = createClientComponentClient<Database>()
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
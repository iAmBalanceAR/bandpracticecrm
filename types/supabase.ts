export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      gigs: {
        Row: {
          sound_check_time: any
          id: string
          user_id: string
          gig_date: string
          title: string
          venue: string
          venue_address: string
          venue_city: string
          venue_state: string
          venue_zip: string
          contact_name: string
          contact_email: string | null
          contact_phone: string | null
          load_in_time: string
          set_time: string
          set_length: string
          gig_details: string
          meal_included: boolean
          hotel_included: boolean
          deposit_amount: number
          deposit_paid: boolean
          contract_total: number
          open_balance: number
          crew_hands_in: boolean
          crew_hands_out: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          gig_status: string
          id?: string
          user_id?: string
          title: string
          venue?: string
          venue_address?: string
          venue_city?: string
          venue_state?: string
          venue_zip?: string
          contact_name?: string
          contact_email?: string
          contact_phone?: string
          gig_date: string
          load_in_time?: string
          set_time?: string
          set_length?: string
          gig_details?: string
          meal_included?: boolean
          hotel_included?: boolean
          deposit_amount?: number
          deposit_paid?: boolean
          total_payout?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          venue?: string
          venue_address?: string
          venue_city?: string
          venue_state?: string
          venue_zip?: string
          contact_name?: string
          contact_email?: string
          contact_phone?: string
          gig_date?: string
          load_in_time?: string
          set_time?: string
          set_length?: string
          gig_details?: string
          meal_included?: boolean
          hotel_included?: boolean
          deposit_amount?: number
          deposit_paid?: boolean
          total_payout?: number
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          email: string
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | null
          subscription_price_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          email: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | null
          subscription_price_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          email?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | null
          subscription_price_id?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          active: boolean
          name: string
          description: string | null
          image: string | null
          metadata: Json
          created: string
          updated: string
        }
        Insert: {
          id: string
          active: boolean
          name: string
          description?: string | null
          image?: string | null
          metadata?: Json
          created?: string
          updated?: string
        }
        Update: {
          id?: string
          active?: boolean
          name?: string
          description?: string | null
          image?: string | null
          metadata?: Json
          created?: string
          updated?: string
        }
      }
      prices: {
        Row: {
          id: string
          product_id: string
          active: boolean
          description: string | null
          unit_amount: number | null
          currency: string
          type: 'one_time' | 'recurring'
          interval: 'day' | 'week' | 'month' | 'year' | null
          interval_count: number | null
          trial_period_days: number | null
          metadata: Json
          created: string
          updated: string
        }
        Insert: {
          id: string
          product_id: string
          active: boolean
          description?: string | null
          unit_amount?: number | null
          currency: string
          type: 'one_time' | 'recurring'
          interval?: 'day' | 'week' | 'month' | 'year' | null
          interval_count?: number | null
          trial_period_days?: number | null
          metadata?: Json
          created?: string
          updated?: string
        }
        Update: {
          id?: string
          product_id?: string
          active?: boolean
          description?: string | null
          unit_amount?: number | null
          currency?: string
          type?: 'one_time' | 'recurring'
          interval?: 'day' | 'week' | 'month' | 'year' | null
          interval_count?: number | null
          trial_period_days?: number | null
          metadata?: Json
          created?: string
          updated?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
          metadata: Json
          price_id: string
          quantity: number | null
          cancel_at_period_end: boolean
          created: string
          current_period_start: string
          current_period_end: string
          ended_at: string | null
          cancel_at: string | null
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
        }
        Insert: {
          id: string
          user_id: string
          status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
          metadata?: Json
          price_id: string
          quantity?: number | null
          cancel_at_period_end: boolean
          created?: string
          current_period_start: string
          current_period_end: string
          ended_at?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
          metadata?: Json
          price_id?: string
          quantity?: number | null
          cancel_at_period_end?: boolean
          created?: string
          current_period_start?: string
          current_period_end?: string
          ended_at?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
        }
      }
      venues: {
        Row: {
          id: string
          title: string
          address: string
          address2: string | null
          city: string
          state: string
          zip: string
          country: string | null
          latitude: string | null
          longitude: string | null
          phone: string | null
          email: string | null
          website: string | null
          facebook: string | null
          twitter: string | null
          instagram: string | null
          youtube: string | null
          capacity: string | null
          description: string | null
          notes: string | null
          age_limit: string | null
          venue_type: string | null
          booking_email: string | null
          booking_phone: string | null
          booking_name: string | null
          booking_info: string | null
          days_open: string | null
          hours_of_operation: string | null
          status: string | null
          verified: boolean
          featured: boolean
          permanently_closed: boolean
          created_at: string
          updated_at: string
          last_scraped: string | null
        }
        Insert: {
          id?: string
          title: string
          address: string
          address2?: string | null
          city: string
          state: string
          zip: string
          country?: string | null
          latitude?: string | null
          longitude?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          facebook?: string | null
          twitter?: string | null
          instagram?: string | null
          youtube?: string | null
          capacity?: string | null
          description?: string | null
          notes?: string | null
          age_limit?: string | null
          venue_type?: string | null
          booking_email?: string | null
          booking_phone?: string | null
          booking_name?: string | null
          booking_info?: string | null
          days_open?: string | null
          hours_of_operation?: string | null
          status?: string | null
          verified?: boolean
          featured?: boolean
          permanently_closed?: boolean
          created_at?: string
          updated_at?: string
          last_scraped?: string | null
        }
        Update: {
          id?: string
          title?: string
          address?: string
          address2?: string | null
          city?: string
          state?: string
          zip?: string
          country?: string | null
          latitude?: string | null
          longitude?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          facebook?: string | null
          twitter?: string | null
          instagram?: string | null
          youtube?: string | null
          capacity?: string | null
          description?: string | null
          notes?: string | null
          age_limit?: string | null
          venue_type?: string | null
          booking_email?: string | null
          booking_phone?: string | null
          booking_name?: string | null
          booking_info?: string | null
          days_open?: string | null
          hours_of_operation?: string | null
          status?: string | null
          verified?: boolean
          featured?: boolean
          permanently_closed?: boolean
          created_at?: string
          updated_at?: string
          last_scraped?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
  Users: {
    Row: {
      id: string
      // ...
    }
    Insert: {
      // ...
    }
    Update: {
      // ...
    }
  }
}

interface UserMetadata {
  is_admin?: boolean
} 
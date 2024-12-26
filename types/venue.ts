import { Database } from './supabase'

export interface Venue {
  id: string
  title: string
  address: string
  address2?: string
  city: string
  state: string
  zip: string
  country?: string
  latitude?: string
  longitude?: string
  phone?: string
  email?: string
  website?: string
  capacity?: string
  description?: string
  booking_email?: string
  booking_phone?: string
  booking_name?: string
  verified?: boolean
  permanently_closed?: boolean
} 
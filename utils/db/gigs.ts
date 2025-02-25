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
      } else {
        // If no default tour exists, check if any tours exist
        const { data: anyTour } = await supabase
          .from('tours')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (!anyTour) {
          // No tours exist at all
          return []
        }
        tourId = anyTour.id
      }
    }

    // Get all gigs with their tour connections, ensuring user_id matches in both tables
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
      .eq('tourconnect.user_id', user.id)
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
      // Connect the gig to the default tour with user_id
      const { error: connectError } = await supabase
        .from('tourconnect')
        .insert([{
          gig_id: newGig.id,
          tour_id: defaultTour.id,
          user_id: user.id
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
    // Check cache first if available
    if (typeof window !== 'undefined') {
      const coordCache = localStorage.getItem('geocode-cache');
      if (coordCache) {
        try {
          const cache = JSON.parse(coordCache);
          if (cache[address]) {
            return cache[address];
          }
        } catch (e) {
          console.error('Error parsing geocode cache:', e);
        }
      }
    }

    const params = new URLSearchParams({
      format: 'json',
      q: address,
      addressdetails: '1',
      limit: '1'
    })

    try {
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 
          'User-Agent': 'BandPracticeTourManager/1.0',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Geocoding failed with status: ${response.status}`);
      }
      
      const data = await response.json()

      if (data && data[0]) {
        const coordinates: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        
        // Cache the result
        if (typeof window !== 'undefined') {
          try {
            const coordCache = localStorage.getItem('geocode-cache');
            const cache = coordCache ? JSON.parse(coordCache) : {};
            cache[address] = coordinates;
            
            // Limit cache size to prevent localStorage overflow
            const cacheEntries = Object.keys(cache);
            if (cacheEntries.length > 100) {
              // Remove oldest entries if cache gets too large
              const entriesToRemove = cacheEntries.slice(0, cacheEntries.length - 100);
              entriesToRemove.forEach(key => delete cache[key]);
            }
            
            localStorage.setItem('geocode-cache', JSON.stringify(cache));
          } catch (e) {
            console.error('Error updating geocode cache:', e);
          }
        }
        
        return coordinates;
      }
      
      console.warn(`No geocoding results found for address: ${address}`);
      return [0, 0];
    } catch (error) {
      console.error('Error geocoding address:', error)
      
      // Implement exponential backoff for retries
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
          console.log('Rate limited by geocoding service, will retry with backoff');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.getCoordinates(address);
        }
      }
      
      return [0, 0] // Return default coordinates if geocoding fails
    }
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

    // Get all gigs with their tour connections, ensuring user_id matches in both tables
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
      .eq('tourconnect.user_id', user.id)
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

    // Check for cached coordinates in localStorage
    const cacheKey = `tour-${tourId}-coordinates`;
    const cachedCoordinates = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
    
    if (cachedCoordinates) {
      try {
        const coordinates = JSON.parse(cachedCoordinates);
        
        // Apply cached coordinates if the venues match
        tourStops.forEach(stop => {
          const cachedStop = coordinates.find((c: any) => 
            c.id === stop.id && 
            c.address === stop.address && 
            c.city === stop.city && 
            c.state === stop.state && 
            c.zip === stop.zip
          );
          
          if (cachedStop) {
            stop.lat = cachedStop.lat;
            stop.lng = cachedStop.lng;
          }
        });
        
        // Check if all stops have coordinates
        const allHaveCoordinates = tourStops.every(stop => stop.lat !== 0 && stop.lng !== 0);
        if (allHaveCoordinates) {
          return { tourStops };
        }
      } catch (e) {
        console.error('Error parsing cached coordinates:', e);
      }
    }

    // Process geocoding in batches to avoid rate limiting
    const batchSize = 3;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let i = 0; i < tourStops.length; i += batchSize) {
      const batch = tourStops.slice(i, i + batchSize);
      const batchPromises = batch.map(async (stop) => {
        // Skip if we already have coordinates from cache
        if (stop.lat !== 0 && stop.lng !== 0) return stop;
        
        const coordinates = await this.getCoordinates(
          `${stop.address}, ${stop.city}, ${stop.state} ${stop.zip}`
        );
        stop.lat = coordinates[0];
        stop.lng = coordinates[1];
        return stop;
      });
      
      await Promise.all(batchPromises);
      
      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < tourStops.length) {
        await delay(300);
      }
    }

    // Cache the coordinates for future use
    if (typeof window !== 'undefined') {
      const coordinatesToCache = tourStops.map(stop => ({
        id: stop.id,
        address: stop.address,
        city: stop.city,
        state: stop.state,
        zip: stop.zip,
        lat: stop.lat,
        lng: stop.lng
      }));
      
      localStorage.setItem(cacheKey, JSON.stringify(coordinatesToCache));
    }

    return { tourStops }
  }
} 
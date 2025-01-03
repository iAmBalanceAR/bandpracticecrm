export interface Venue {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  created_at: string;
  updated_at: string;
}

export interface SavedVenue {
  id: string;
  user_id: string;
  venue_id: string;
  created_date: string;
  last_updated: string;
}

export interface VenueSearchFilters {
  query: string;
  city: string;
  state: string;
  venue_type: string;
  capacity?: number;
  allows_underage: boolean;
  has_bar: boolean;
  has_stage: boolean;
  has_sound_system: boolean;
  has_lighting_system: boolean;
  has_parking: boolean;
  verified: boolean;
  featured: boolean;
  sort_by: 'title' | 'capacity' | 'city' | 'state';
  sort_order: 'asc' | 'desc';
  page: number;
  per_page: number;
  range_miles?: number;
} 
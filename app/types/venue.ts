export interface Venue {
  latitude: number;
  longitude: number;
  id: string;
  title: string;
  description?: string;
  city: string;
  state: string;
  address?: string;
  zip_code?: string;
  capacity?: number;
  venue_type?: string;
  primary_image_url?: string;
  gallery_image_urls?: string[];
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  social_media?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  amenities?: string[];
  verified: boolean;
  featured: boolean;
  allows_underage: boolean;
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
  sort_by: string;
  sort_order: 'asc' | 'desc';
  page: number;
  per_page: number;
} 
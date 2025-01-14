import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { VenueSearchFilters } from '@/app/types/venue';

// Function to calculate the bounding box for a given point and radius
function getBoundingBox(lat: number, lng: number, radiusMiles: number) {
  const milesPerLat = 69; // Approximate miles per degree of latitude
  const milesPerLng = 69 * Math.cos(lat * (Math.PI / 180)); // Adjust for longitude based on latitude
  
  const latDelta = radiusMiles / milesPerLat;
  const lngDelta = radiusMiles / milesPerLng;
  
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
}

// Helper function to calculate venue completeness score
function getVenueCompletenessScore(venue: any) {
  const fields = [
    venue.phone && venue.phone !== 'null',
    venue.email && venue.email !== 'null',
    venue.description && venue.description !== 'null',
    venue.capacity && venue.capacity !== 'null',
    venue.venuetype && venue.venuetype !== 'null',
    venue.latitude && venue.longitude && !isNaN(Number(venue.latitude)) && !isNaN(Number(venue.longitude))
  ];
  return fields.filter(Boolean).length;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const city = searchParams.get('city') || '';
    const state = searchParams.get('state') || '';
    const venueType = searchParams.get('venue_type') || '';
    const capacity = Number(searchParams.get('capacity')) || 0;
    const allowsUnderage = searchParams.get('allows_underage') === 'true';
    const hasBar = searchParams.get('has_bar') === 'true';
    const hasStage = searchParams.get('has_stage') === 'true';
    const hasSoundSystem = searchParams.get('has_sound_system') === 'true';
    const hasLightingSystem = searchParams.get('has_lighting_system') === 'true';
    const hasParking = searchParams.get('has_parking') === 'true';
    const verified = searchParams.get('verified') === 'true';
    const featured = searchParams.get('featured') === 'true';
    const sortBy = searchParams.get('sort_by') || 'title';
    const sortOrder = (searchParams.get('sort_order') || 'asc') as 'asc' | 'desc';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const perPage = Math.min(50, Number(searchParams.get('per_page')) || 12);
    const rangeMiles = Number(searchParams.get('range_miles')) || 0;
    
    const supabase = createClient();
    let dbQuery = supabase.from('venues').select('*', { count: 'exact' });

    // Apply text search if query exists
    if (query) {
      dbQuery = dbQuery.or(
        `title.ilike.%${query}%,` +
        `description.ilike.%${query}%,` +
        `city.ilike.%${query}%,` +
        `state.ilike.%${query}%`
      );
    }

    // Apply individual filters
    if (city) {
      dbQuery = dbQuery.ilike('city', `%${city}%`);
    }
    if (state) {
      dbQuery = dbQuery.eq('state', state);
    }
    if (venueType) {
      dbQuery = dbQuery.eq('venue_type', venueType);
    }
    if (capacity > 0) {
      dbQuery = dbQuery.gte('capacity', capacity);
    }
    if (allowsUnderage) {
      dbQuery = dbQuery.eq('allows_underage', true);
    }
    if (hasBar) {
      dbQuery = dbQuery.eq('has_bar', true);
    }
    if (hasStage) {
      dbQuery = dbQuery.eq('has_stage', true);
    }
    if (hasSoundSystem) {
      dbQuery = dbQuery.eq('has_sound_system', true);
    }
    if (hasLightingSystem) {
      dbQuery = dbQuery.eq('has_lighting_system', true);
    }
    if (hasParking) {
      dbQuery = dbQuery.eq('has_parking', true);
    }
    if (verified) {
      dbQuery = dbQuery.eq('verified', true);
    }
    if (featured) {
      dbQuery = dbQuery.eq('featured', true);
    }

    // Get initial results
    let { data: venues, count, error } = await dbQuery;

    // Apply range filter if specified and we have results
    if (rangeMiles > 0 && (city || state) && venues && venues.length > 0) {
      // Get coordinates for the search location
      const searchLocation = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          `${city}, ${state}, USA`
        )}`
      ).then(res => res.json());

      if (searchLocation && searchLocation[0]) {
        const centerLat = parseFloat(searchLocation[0].lat);
        const centerLng = parseFloat(searchLocation[0].lon);

        // Filter venues by distance
        venues = venues.filter(venue => {
          if (!venue.latitude || !venue.longitude) return false;
          
          // Calculate distance using the Haversine formula
          const R = 3959; // Earth's radius in miles
          const dLat = (venue.latitude - centerLat) * (Math.PI / 180);
          const dLon = (venue.longitude - centerLng) * (Math.PI / 180);
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(centerLat * (Math.PI / 180)) * Math.cos(venue.latitude * (Math.PI / 180)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          
          return distance <= rangeMiles;
        });

        count = venues.length;
      }
    }

    // Apply sorting
    if (venues) {
      if (sortBy === 'completeness' || !sortBy) {
        // Sort by completeness first
        venues = venues.sort((a, b) => {
          const aScore = getVenueCompletenessScore(a);
          const bScore = getVenueCompletenessScore(b);
          if (aScore !== bScore) {
            return sortOrder === 'asc' ? aScore - bScore : bScore - aScore;
          }
          // If completeness scores are equal, sort by title
          return a.title.localeCompare(b.title);
        });
      } else if (sortBy === 'distance' && rangeMiles > 0) {
        // Distance sorting would be handled here if needed
        venues = venues.sort((a, b) => (sortOrder === 'asc' ? -1 : 1));
      } else {
        venues = venues.sort((a, b) => {
          const aVal = a[sortBy] || '';
          const bVal = b[sortBy] || '';
          return sortOrder === 'asc' 
            ? aVal.toString().localeCompare(bVal.toString())
            : bVal.toString().localeCompare(aVal.toString());
        });
      }
    }

    // Apply pagination after sorting
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedVenues = venues ? venues.slice(start, end) : [];

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    return NextResponse.json({
      venues: paginatedVenues,
      total: count || 0,
      page,
      per_page: perPage
    });
  } catch (error) {
    console.error('Venue search error:', error);
    return NextResponse.json(
      { error: 'Failed to search venues' },
      { status: 500 }
    );
  }
} 
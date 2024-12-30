import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { VenueSearchFilters } from '@/app/types/venue';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const perPage = Math.min(50, Number(searchParams.get('per_page')) || 12);
    
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

    // Apply pagination
    const start = (page - 1) * perPage;
    const end = start + perPage - 1;
    
    const { data: venues, count, error } = await dbQuery
      .range(start, end)
      .order('title');

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    return NextResponse.json({
      venues: venues || [],
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
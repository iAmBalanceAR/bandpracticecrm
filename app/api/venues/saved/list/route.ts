import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createClient();

    // Get current user's saved venues
    const { data: savedVenues, error: savedError } = await supabase
      .from('saved_venues')
      .select('venue_id');

    if (savedError) throw savedError;

    if (!savedVenues || savedVenues.length === 0) {
      return NextResponse.json({ venues: [] });
    }

    // Get the full venue details for saved venues
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select('*')
      .in('id', savedVenues.map(sv => sv.venue_id));

    if (venuesError) throw venuesError;

    return NextResponse.json({ venues: venues || [] });
  } catch (error) {
    console.error('Error fetching saved venues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved venues' },
      { status: 500 }
    );
  }
} 
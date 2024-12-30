import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { venue_id } = await request.json();
    if (!venue_id) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    // Check if venue is already saved
    const { data: existing } = await supabase
      .from('saved_venues')
      .select()
      .eq('user_id', user.id)
      .eq('venue_id', venue_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Venue already saved' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('saved_venues')
      .insert({ venue_id, user_id: user.id });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving venue:', error);
    return NextResponse.json(
      { error: 'Failed to save venue' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { venue_id } = await request.json();
    if (!venue_id) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('saved_venues')
      .delete()
      .eq('user_id', user.id)
      .eq('venue_id', venue_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing saved venue:', error);
    return NextResponse.json(
      { error: 'Failed to remove saved venue' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabase
      .from('saved_venues')
      .select('venue_id')
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching saved venues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved venues' },
      { status: 500 }
    );
  }
} 
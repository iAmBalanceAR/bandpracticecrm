import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  
  const { searchParams } = new URL(request.url);
  const filters = {
    capacity: searchParams.get('capacity') ? parseInt(searchParams.get('capacity') as string) : undefined,
    state: searchParams.get('state') || undefined,
    city: searchParams.get('city') || undefined,
  };

  let query = supabase
    .from('venues')
    .select('*');

  if (filters.state) {
    query = query.eq('state', filters.state);
  }

  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }

  if (filters.capacity) {
    query = query.lte('capacity', filters.capacity);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
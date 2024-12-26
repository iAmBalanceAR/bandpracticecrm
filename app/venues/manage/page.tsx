'use server';

import VenueManagement from '@/components/crm/venue-management';
import createClient from '@/utils/supabase/server';

async function getVenues() {
  const supabase = createClient();
  const { data: venues, error } = await supabase
    .from('venues')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching venues:', error);
    return [];
  }

  return venues;
}

export default async function ManageVenuesPage() {
  const venues = await getVenues();

  return <VenueManagement initialVenues={venues} />;
} 
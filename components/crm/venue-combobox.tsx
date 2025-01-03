'use client';

import { useState } from 'react';
import createClient from '@/utils/supabase/client';
import { Input } from '@/components/ui/input';
import { Venue } from '@/app/types/venue';

interface VenueComboboxProps {
  selectedVenue: Venue | null;
  onVenueSelect: (venue: Venue | null) => void;
}

export function VenueCombobox({ selectedVenue, onVenueSelect }: VenueComboboxProps) {
  const [searchValue, setSearchValue] = useState(selectedVenue?.title || '');
  const [venues, setVenues] = useState<Venue[]>([]);
  const supabase = createClient();

  const handleVenueSearch = async (value: string) => {
    setSearchValue(value);
    if (value === '') {
      setVenues([]);
      return;
    }
    if (value.length > 2) {
      try {
        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .ilike('title', `%${value}%`)
          .limit(5);
        
        if (error) throw error;
        setVenues(data || []);
      } catch (error) {
        console.error('Error searching venues:', error);
        setVenues([]);
      }
    } else {
      setVenues([]);
    }
  };

  return (
    <div className="relative">
      <Input
        placeholder="Search venues..."
        value={searchValue}
        onChange={(e) => handleVenueSearch(e.target.value)}
        className="bg-[#1B2559] border-blue-800"
      />
      {venues.length > 0 && (
        <div className="absolute w-full z-50 top-full mt-1 bg-[#1B2559] rounded-md shadow-lg max-h-[200px] overflow-y-auto">
          {venues.map((venue) => (
            <div
              key={venue.id}
              onClick={() => {
                onVenueSelect(venue);
                setSearchValue(venue.title);
                setVenues([]);
              }}
              className="cursor-pointer hover:bg-[#2a3c7d] p-2 flex justify-between items-center"
            >
              <span className="font-medium">{venue.title}</span>
              <span className="text-sm text-gray-400 ml-2">• {venue.city}, {venue.state}</span>
            </div>
          ))}
        </div>
      )}
      {searchValue.length > 2 && venues.length === 0 && !selectedVenue && (
        <div className="absolute w-full z-50 top-full mt-1 bg-[#1B2559] rounded-md shadow-lg p-2">
          No venues found
        </div>
      )}
    </div>
  );
} 
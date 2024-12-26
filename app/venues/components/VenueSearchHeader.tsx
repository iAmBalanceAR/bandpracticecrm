'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import createClient from '@/utils/supabase/client';

interface VenueSearchHeaderProps {
  query: string;
  onSearch: (query: string) => void;
}

interface Venue {
  id: string;
  title: string;
  city: string;
  state: string;
}

export default function VenueSearchHeader({ query, onSearch }: VenueSearchHeaderProps) {
  const [searchQuery, setSearchQuery] = useState(query);
  const [isOpen, setIsOpen] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const supabase = createClient();

  useEffect(() => {
    const searchVenues = async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        setVenues([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('venues')
          .select('id, title, city, state')
          .ilike('title', `%${debouncedSearch}%`)
          .limit(5);
        
        if (error) throw error;
        setVenues(data || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Error searching venues:', error);
        setVenues([]);
      }
    };

    searchVenues();
  }, [debouncedSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    setIsOpen(false);
  };

  const handleSelect = (venue: Venue) => {
    setSearchQuery(venue.title);
    onSearch(venue.title);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value); // Real-time search
    setIsOpen(value.length >= 2);
  };

  return (
    <div className="w-full">
      <div className="container mx-auto px-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    value={searchQuery}
                    onChange={handleInputChange}
                    placeholder="Search venues by name, location, or type..."
                    className="pl-10 bg-[#131d43]"
                  />
                </div>
              </PopoverTrigger>
              {isOpen && venues.length > 0 && (
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandEmpty>No venues found.</CommandEmpty>
                    <CommandGroup>
                      {venues.map((venue) => (
                        <CommandItem
                          key={venue.id}
                          onSelect={() => handleSelect(venue)}
                          className="flex flex-col items-start p-2 cursor-pointer hover:bg-[#1B2559]"
                        >
                          <div className="font-medium">{venue.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {venue.city}, {venue.state}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
          </div>
          <Button type="submit" className="bg-green-700 text-white hover:bg-green-600">
            Search
          </Button>
        </form>
      </div>
    </div>
  );
} 
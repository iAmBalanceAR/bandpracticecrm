'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

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

export default function VenueSearchHeader({ query = '', onSearch }: VenueSearchHeaderProps) {
  const [searchQuery, setSearchQuery] = useState(query);
  const [suggestions, setSuggestions] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmedSearch = debouncedSearch.trim();
      if (!trimmedSearch || trimmedSearch.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/venues/search?query=${encodeURIComponent(trimmedSearch)}&per_page=5`);
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        
        const { venues } = await response.json();
        setSuggestions(venues || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      onSearch(trimmedQuery);
      setShowSuggestions(false);
    }
  };

  const handleSelect = (venue: Venue) => {
    setSearchQuery(venue.title);
    onSearch(venue.title);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full">
      <div className="mx-auto max-w-7xl pb-2 bg-[#0a1129] border-blue-500 border rounded-md mb-4 shadow-lg">
        <div className="max-w-full m-4">
          <h2 className="text-3xl font-bold mt-0 text-white mb-2">
            Search Venues:
          </h2>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <div className="relative">
                {isLoading ? (
                  <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                )}
                <Input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim().length >= 2) {
                      setShowSuggestions(true);
                    }
                  }}
                  onFocus={() => {
                    if (searchQuery.trim().length >= 2 && suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Search venues by name, location, or type..."
                  className="pl-10 border border-white"
                />
              </div>
              {showSuggestions && (
                <div 
                  ref={dropdownRef}
                  className="absolute w-full mt-1 bg-[#131d43] border border-gray-700 rounded-md shadow-lg overflow-hidden z-[9999]"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((venue) => (
                      <button
                        key={venue.id}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-[#1B2559] focus:bg-[#1B2559] focus:outline-none"
                        onClick={() => handleSelect(venue)}
                      >
                        <div className="font-medium">{venue.title}</div>
                        <div className="text-md text-muted-foreground">
                          {venue.city}, {venue.state}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-muted-foreground">No results found</div>
                  )}
                </div>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={!searchQuery.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-md text-shadow-black text-shadow-sm min-w-[100px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 
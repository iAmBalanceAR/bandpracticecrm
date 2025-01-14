'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VenueSearchFilters as FilterType } from '@/app/types/venue';
import { STATES, VENUE_TYPES, SORT_OPTIONS } from '@/lib/constants';
import { useDebounce } from '@/hooks/use-debounce';

interface VenueSearchFiltersProps {
  filters: FilterType;
  onFilterChange: (filters: FilterType) => void;
}

export default function VenueSearchFilters({ 
  filters = {
    query: '',
    city: '',
    state: '',
    venue_type: '',
    capacity: undefined,
    allows_underage: false,
    has_bar: false,
    has_stage: false,
    has_sound_system: false,
    has_lighting_system: false,
    has_parking: false,
    verified: false,
    featured: false,
    sort_by: 'title',
    sort_order: 'asc',
    page: 1,
    per_page: 12,
    range_miles: 0 // Default to no range limit
  }, 
  onFilterChange 
}: VenueSearchFiltersProps) {
  const [localCity, setLocalCity] = useState(filters.city || '');
  const debouncedCity = useDebounce(localCity, 500);
  const [range, setRange] = useState(filters.range_miles || 0);

  // Handle immediate filter changes (non-text inputs)
  const handleFilterChange = (key: keyof FilterType, value: any) => {
    if (key === 'city') {
      setLocalCity(value);
    } else {
      onFilterChange({
        ...filters,
        [key]: value === 'all' ? '' : value,
        page: 1
      });
    }
  };

  // Handle range change
  const handleRangeChange = (value: string) => {
    const numValue = Number(value);
    setRange(numValue);
    onFilterChange({
      ...filters,
      range_miles: numValue,
      page: 1
    });
  };

  // Handle debounced city changes
  useEffect(() => {
    if (debouncedCity !== filters.city) {
      onFilterChange({
        ...filters,
        city: debouncedCity,
        page: 1
      });
    }
  }, [debouncedCity]);

  return (
    <Card className="p-4 space-y-6 bg-[#030817] border-blue-500 border">
      <div className="space-y-4">
        <div>
          <Label htmlFor="state">State</Label>
          <Select
            value={filters.state || 'all'}
            onValueChange={(value) => handleFilterChange('state', value)}
          >
            <SelectTrigger id="state">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="w-[400px] max-h-[400px] bg-[#1B2559] rounded-lg text-white z-[10000]">
              <SelectItem value="all" className="col-span-3">All States</SelectItem>
              <div className="grid grid-cols-3 gap-x-2">
                {(STATES || []).map((state) => (
                  <SelectItem key={state.value} value={state.value} className="w-full cursor-pointer">
                    {state.label}
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={localCity}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="mt-1"
            placeholder="Enter city name"
          />
        </div>

        {(filters.city || filters.state) && (
          <div className="space-y-2">
            <Label>Range (miles)</Label>
            <Select
              value={String(range)}
              onValueChange={handleRangeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent className="bg-[#1B2559] rounded-lg text-white z-[10000]">
                <SelectItem value="0">No limit</SelectItem>
                <SelectItem value="25">25 miles</SelectItem>
                <SelectItem value="50">50 miles</SelectItem>
                <SelectItem value="75">75 miles</SelectItem>
                <SelectItem value="100">100 miles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Capacity</Label>
          <Input
            type="number"
            placeholder="Up to"
            value={filters.capacity || ''}
            onChange={(e) => handleFilterChange('capacity', e.target.value)}
          />
        </div>

        <div>
          <Label>Sort By</Label>
          <Select
            value={filters.sort_by || 'title'}
            onValueChange={(value) => handleFilterChange('sort_by', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1B2559] rounded-lg text-white z-[10000]">
              {(SORT_OPTIONS || []).map((option) => (
                <SelectItem className="cursor-pointer" key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Sort Order</Label>
          <Select
            value={filters.sort_order || 'asc'}
            onValueChange={(value) => handleFilterChange('sort_order', value as 'asc' | 'desc')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1B2559] rounded-lg text-white z-[10000]">
              <SelectItem value="asc" className="cursor-pointer">Ascending</SelectItem>
              <SelectItem value="desc" className="cursor-pointer">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={() => {
            setLocalCity('');
            setRange(0);
            onFilterChange({
              query: '',
              city: '',
              state: '',
              venue_type: '',
              capacity: undefined,
              allows_underage: false,
              has_bar: false,
              has_stage: false,
              has_sound_system: false,
              has_lighting_system: false,
              has_parking: false,
              verified: false,
              featured: false,
              sort_by: 'title',
              sort_order: 'asc',
              page: 1,
              per_page: 12,
              range_miles: 0
            });
          }}
          className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </Card>
  );
} 
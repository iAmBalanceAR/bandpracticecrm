'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { VenueSearchFilters as FilterType } from '@/app/types/venue';
import { STATES, VENUE_TYPES, SORT_OPTIONS } from '@/lib/constants';

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
    per_page: 12
  }, 
  onFilterChange 
}: VenueSearchFiltersProps) {
  const handleFilterChange = (key: keyof FilterType, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value === 'all' ? '' : value,
      page: 1 // Reset page when filters change
    });
  };

  return (
    <Card className="p-4 space-y-6 bg-[#030817]  border-blue-800 border">
      <div className="space-y-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={filters.city || ''}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="mt-1"
            placeholder="Enter city name"
          />
        </div>

        <div>
          <Label htmlFor="state">State</Label>
          <Select
            value={filters.state || 'all'}
            onValueChange={(value) => handleFilterChange('state', value)}
          >
            <SelectTrigger id="state">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="w-[380px] max-h-[400px]">
              <SelectItem value="all" className="col-span-3">All States</SelectItem>
              <div className="grid grid-cols-3 gap-x-2">
                {(STATES || []).map((state) => (
                  <SelectItem key={state.value} value={state.value} className="w-full">
                    {state.label}
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>

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
            <SelectContent>
              {(SORT_OPTIONS || []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
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
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={() => onFilterChange({
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
            per_page: 12
          })}
          className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </Card>
  );
} 
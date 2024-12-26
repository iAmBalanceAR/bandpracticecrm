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

interface StateOption {
  value: string;
  label: string;
}

interface VenueTypeOption {
  value: string;
  label: string;
}

interface SortOption {
  value: string;
  label: string;
}

export default function VenueSearchFilters({ filters, onFilterChange }: VenueSearchFiltersProps) {
  const handleFilterChange = (key: keyof FilterType, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
      page: 1 // Reset page when filters change
    });
  };

  return (
    <Card className="p-4 space-y-6 bg-[#131d43] border-none rounded-md">
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
            value={filters.state || ''}
            onValueChange={(value) => handleFilterChange('state', value)}
          >
            <SelectTrigger id="state">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="max-h-[400px] overflow-y-auto">
              <SelectItem value="">All States</SelectItem>
              {STATES.map((state: StateOption) => (
                <SelectItem 
                  key={state.value} 
                  value={state.value}
                >
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            min="0"
            value={filters.capacity || ''}
            onChange={(e) => handleFilterChange('capacity', e.target.value ? parseInt(e.target.value) : undefined)}
            className="mt-1"
            placeholder="Up to"
          />
          <p className="text-xs text-muted-foreground">Shows venues with capacity up to this number</p>
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
              {SORT_OPTIONS.map((option: SortOption) => (
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
      </div>
    </Card>
  );
} 
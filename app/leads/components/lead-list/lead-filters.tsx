'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { LeadStatus, LeadPriority, LeadType } from '@/app/types/lead';
import { create } from 'zustand';

interface FiltersState {
  query: string;
  status: LeadStatus[];
  priority: LeadPriority[];
  type: LeadType[];
  assignedTo: string[];
  tags: string[];
  dateRange: { start: Date; end: Date } | null;
  setFilter: (key: string, value: any) => void;
  toggleFilter: (key: string, value: any) => void;
  reset: () => void;
}

export const useLeadFilters = create<FiltersState>((set) => ({
  query: '',
  status: [],
  priority: [],
  type: [],
  assignedTo: [],
  tags: [],
  dateRange: null,
  setFilter: (key, value) => set((state) => ({ ...state, [key]: value })),
  toggleFilter: (key, value) =>
    set((state) => ({
      ...state,
      [key]: state[key as keyof FiltersState].includes(value)
        ? (state[key as keyof FiltersState] as any[]).filter((v) => v !== value)
        : [...(state[key as keyof FiltersState] as any[]), value],
    })),
  reset: () =>
    set({
      query: '',
      status: [],
      priority: [],
      type: [],
      assignedTo: [],
      tags: [],
      dateRange: null,
    }),
}));

const statusOptions: LeadStatus[] = ['new', 'contacted', 'in_progress', 'negotiating', 'won', 'lost', 'archived'];
const priorityOptions: LeadPriority[] = ['low', 'medium', 'high'];
const typeOptions: LeadType[] = ['venue', 'artist', 'promoter', 'sponsor', 'other'];

const statusColors = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  in_progress: 'bg-purple-500',
  negotiating: 'bg-orange-500',
  won: 'bg-green-500',
  lost: 'bg-red-500',
  archived: 'bg-gray-500'
} as const;

const priorityColors = {
  low: 'bg-blue-200 text-blue-700',
  medium: 'bg-yellow-200 text-yellow-700',
  high: 'bg-red-200 text-red-700'
} as const;

export default function LeadFilters() {
  const { query, status, priority, type, dateRange, setFilter, toggleFilter, reset } = useLeadFilters();
  const [date, setDate] = useState<Date | undefined>(undefined);

  return (
    <Card className="bg-[#111C44] border-none">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search" className="text-white">Search</Label>
          <Input
            id="search"
            placeholder="Search leads..."
            value={query}
            onChange={(e) => setFilter('query', e.target.value)}
            className="bg-[#192555] border-none text-white placeholder:text-gray-400"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">Status</Label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className={cn(
                  'cursor-pointer hover:opacity-80',
                  status.includes(s) ? statusColors[s] : 'bg-[#192555]'
                )}
                onClick={() => toggleFilter('status', s)}
              >
                {s.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Priority</Label>
          <div className="flex flex-wrap gap-2">
            {priorityOptions.map((p) => (
              <Badge
                key={p}
                variant="secondary"
                className={cn(
                  'cursor-pointer hover:opacity-80',
                  priority.includes(p) ? priorityColors[p] : 'bg-[#192555]'
                )}
                onClick={() => toggleFilter('priority', p)}
              >
                {p}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Type</Label>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((t) => (
              <Badge
                key={t}
                variant="secondary"
                className={cn(
                  'cursor-pointer hover:opacity-80',
                  type.includes(t) ? 'bg-[#2A3C6E]' : 'bg-[#192555]'
                )}
                onClick={() => toggleFilter('type', t)}
              >
                {t}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal bg-[#192555] border-none',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.start ? (
                  dateRange.end ? (
                    <>
                      {format(dateRange.start, 'LLL dd, y')} -{' '}
                      {format(dateRange.end, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.start, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.start}
                selected={dateRange}
                onSelect={(range) => setFilter('dateRange', range)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          variant="outline"
          className="w-full bg-[#192555] border-none text-white hover:bg-[#2A3C6E]"
          onClick={reset}
        >
          Reset Filters
        </Button>
      </CardContent>
    </Card>
  );
} 
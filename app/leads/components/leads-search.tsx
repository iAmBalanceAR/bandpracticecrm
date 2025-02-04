'use client';

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";

export interface LeadFilters {
  search: string;
  status: string;
  type: string;
  priority: string;
  dateRange: { from: Date | undefined; to: Date | undefined } | undefined;
  location: string;
  sort: string;
}

interface LeadsSearchProps {
  onFiltersChange: (filters: LeadFilters) => void;
}

const defaultFilters: LeadFilters = {
  search: "",
  status: "all",
  type: "all",
  priority: "all",
  dateRange: undefined,
  location: "all",
  sort: "newest"
};

export default function LeadsSearch({ onFiltersChange }: LeadsSearchProps) {
  const [filters, setFilters] = useState<LeadFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(true);

  const handleFilterChange = (key: keyof LeadFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search leads by title, company, contact info..."
          className="pl-10 bg-[#1B2559] border-blue-600 text-white placeholder:text-gray-400"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
      </div>

      {/* Filter Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="bg-[#1B2559] border-blue-600 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B2559] rounded-lg text-white z-[10000]">
            <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
            <SelectItem value="new" className="cursor-pointer">New</SelectItem>
            <SelectItem value="contacted" className="cursor-pointer">Contacted</SelectItem>
            <SelectItem value="in_progress" className="cursor-pointer">In Progress</SelectItem>
            <SelectItem value="negotiating" className="cursor-pointer">Negotiating</SelectItem>
            <SelectItem value="won" className="cursor-pointer">Won</SelectItem>
            <SelectItem value="lost" className="cursor-pointer">Lost</SelectItem>
            <SelectItem value="archived" className="cursor-pointer">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.type}
          onValueChange={(value) => handleFilterChange('type', value)}
        >
          <SelectTrigger className="bg-[#1B2559] border-blue-600 text-white">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B2559] rounded-lg text-white z-[10000]">
            <SelectItem value="all" className="cursor-pointer">All Types</SelectItem>
            <SelectItem value="wedding" className="cursor-pointer">Wedding</SelectItem>
            <SelectItem value="corporate" className="cursor-pointer">Corporate</SelectItem>
            <SelectItem value="festival" className="cursor-pointer">Festival</SelectItem>
            <SelectItem value="private" className="cursor-pointer">Private Event</SelectItem>
            <SelectItem value="venue" className="cursor-pointer">Venue</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.priority}
          onValueChange={(value) => handleFilterChange('priority', value)}
        >
          <SelectTrigger className="bg-[#1B2559] border-blue-600 text-white">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B2559] rounded-lg text-white z-[10000]">
            <SelectItem value="all" className="cursor-pointer">All Priority</SelectItem>
            <SelectItem value="high" className="cursor-pointer">High</SelectItem>
            <SelectItem value="medium" className="cursor-pointer">Medium</SelectItem>
            <SelectItem value="low" className="cursor-pointer">Low</SelectItem>
          </SelectContent>
        </Select>

        <DatePickerWithRange
          className="bg-[#1B2559] border-blue-600 text-white"
          value={filters.dateRange}
          onChange={(value) => handleFilterChange('dateRange', value)}
        />

        <Select
          value={filters.location}
          onValueChange={(value) => handleFilterChange('location', value)}
        >
          <SelectTrigger className="bg-[#1B2559] border-blue-600 text-white">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B2559] rounded-lg text-white z-[10000]">
            <SelectItem value="all" className="cursor-pointer">All Locations</SelectItem>
            <SelectItem value="local" className="cursor-pointer">Local</SelectItem>
            <SelectItem value="regional" className="cursor-pointer">Regional</SelectItem>
            <SelectItem value="national" className="cursor-pointer">National</SelectItem>
            <SelectItem value="international" className="cursor-pointer">International</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(value) => handleFilterChange('sort', value)}
        >
          <SelectTrigger className="bg-[#1B2559] border-blue-600 text-white">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B2559] rounded-lg text-white z-[10000]">
            <SelectItem value="newest" className="cursor-pointer">Newest First</SelectItem>
            <SelectItem value="oldest" className="cursor-pointer">Oldest First</SelectItem>
            <SelectItem value="priority" className="cursor-pointer">Priority (High-Low)</SelectItem>
            <SelectItem value="status" className="cursor-pointer">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 
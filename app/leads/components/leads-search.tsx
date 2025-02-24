'use client';

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useState } from "react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { LeadType, LeadStatus, LeadPriority } from "@/app/types/lead";

export interface LeadFilters {
  search: string;
  status: string;
  type: string;
  priority: string;
  dateRange: { from: Date | undefined; to: Date | undefined } | undefined;
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
  sort: "newest"
};

const statusOptions: LeadStatus[] = ['new', 'contacted', 'in_progress', 'negotiating', 'won', 'lost', 'archived'];
const priorityOptions: LeadPriority[] = ['low', 'medium', 'high'];
const typeOptions: LeadType[] = ['venue', 'artist', 'promoter', 'sponsor', 'other'];

export default function LeadsSearch({ onFiltersChange }: LeadsSearchProps) {
  const [filters, setFilters] = useState<LeadFilters>(defaultFilters);

  const handleFilterChange = (key: keyof LeadFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const formatLabel = (str: string) => {
    return str.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="bg-[#1B2559] border-blue-600 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B2559] rounded-lg text-white z-[10000]">
            <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status} className="cursor-pointer">
                {formatLabel(status)}
              </SelectItem>
            ))}
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
            {typeOptions.map((type) => (
              <SelectItem key={type} value={type} className="cursor-pointer">
                {formatLabel(type)}
              </SelectItem>
            ))}
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
            {priorityOptions.map((priority) => (
              <SelectItem key={priority} value={priority} className="cursor-pointer">
                {formatLabel(priority)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DatePickerWithRange
          className="bg-[#1B2559] border-blue-600 text-white"
          value={filters.dateRange}
          onChange={(value) => handleFilterChange('dateRange', value)}
        />

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
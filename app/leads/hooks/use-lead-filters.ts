import { create } from 'zustand';
import { LeadFilters } from '@/app/types/lead';

interface LeadFiltersState {
  filters: LeadFilters;
  setFilter: <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) => void;
  resetFilters: () => void;
}

const initialFilters: LeadFilters = {
  query: '',
  status: [],
  priority: [],
  type: [],
  assignedTo: [],
  tags: [],
  dateRange: undefined
};

export const useLeadFilters = create<LeadFiltersState>((set) => ({
  filters: initialFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value
      }
    })),
  resetFilters: () => set({ filters: initialFilters })
})); 
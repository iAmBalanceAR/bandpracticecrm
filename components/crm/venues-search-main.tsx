import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { VenueSearchFilters } from '@/app/types/venue';
import VenueSearchHeader from '@/components/crm/venue-search-header';
import VenueSearchFiltersComponent from '@/components/crm/venue-search-filters';
import VenueGrid from '@/components/crm/venue-grid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function VenuesSearchMain() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [venues, setVenues] = useState<any[]>([]);
    const [savedVenues, setSavedVenues] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [hasSearched, setHasSearched] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
  
    const filters: VenueSearchFilters = {
      query: searchParams.get('query') ?? '',
      city: searchParams.get('city') ?? '',
      state: searchParams.get('state') ?? '',
      venue_type: searchParams.get('venue_type') ?? '',
      capacity: Number(searchParams.get('capacity')) || 0,
      verified: searchParams.get('verified') === 'true',
      featured: searchParams.get('featured') === 'true',
      allows_underage: searchParams.get('allows_underage') === 'true',
      sort_by: (searchParams.get('sort_by') as VenueSearchFilters['sort_by']) ?? 'title',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') ?? 'asc',
      page: currentPage,
      per_page: 12,
      has_bar: searchParams.get('has_bar') === 'true',
      has_stage: searchParams.get('has_stage') === 'true',
      has_sound_system: searchParams.get('has_sound_system') === 'true',
      has_lighting_system: searchParams.get('has_lighting_system') === 'true',
      has_parking: searchParams.get('has_parking') === 'true'
    };
  
    // Fetch saved venues
    const fetchSavedVenues = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/venues/saved/list');
        if (!response.ok) throw new Error('Failed to fetch saved venues');
        const data = await response.json();
        setSavedVenues(data.venues || []);
      } catch (error) {
        console.error('Error fetching saved venues:', error);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchSavedVenues();
    }, []);
  
    const handleSearch = async (newFilters: Partial<VenueSearchFilters>) => {
      setLoading(true);
      const updatedFilters = { ...filters, ...newFilters, page: 1 };
      
      // Build query string
      const params = new URLSearchParams();
      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, String(value));
        }
      });
      
      try {
        const response = await fetch(`/api/venues/search?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch venues');
        
        const data = await response.json();
        setVenues(data.venues);
        setTotalCount(data.total);
        setHasSearched(true);
        setCurrentPage(1);
        
        // Update URL
        router.push(`/venues?${params.toString()}`);
      } catch (error) {
        console.error('Error fetching venues:', error);
        setVenues([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };
  
    const handleLoadMore = async () => {
      setLoading(true);
      const nextPage = currentPage + 1;
      
      // Build query string with next page
      const params = new URLSearchParams();
      Object.entries({ ...filters, page: nextPage }).forEach(([key, value]) => {
        if (value) {
          params.set(key, String(value));
        }
      });
      
      try {
        const response = await fetch(`/api/venues/search?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch more venues');
        
        const data = await response.json();
        setVenues([...venues, ...data.venues]);
        setTotalCount(data.total);
        setCurrentPage(nextPage);
      } catch (error) {
        console.error('Error fetching more venues:', error);
      } finally {
        setLoading(false);
      }
    };
  
    // Only fetch initial results if there are search params
    useEffect(() => {
      if (searchParams.toString()) {
        handleSearch(filters);
      }
    }, []);

    return (
      <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-4 py-4">
        <div className="flex justify-center mb-8">
          <Tabs defaultValue="search" className="w-full">
            <div className="flex justify-center">
              <TabsList className="w-full max-w-lg">
                <TabsTrigger value="search" className="flex-1">Search Venues</TabsTrigger>
                <TabsTrigger value="saved" className="flex-1">Saved Venues</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="search">
              <VenueSearchHeader
                query={filters.query}
                onSearch={(query) => handleSearch({ query })}
              />
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-64 flex-none">
                  <VenueSearchFiltersComponent
                    filters={filters}
                    onFilterChange={handleSearch}
                  />
                </div>
                <div className="flex-1">
                  {!hasSearched ? (
                    <div className="text-center py-12">
                      <h2 className="text-xl text-gray-400">
                        Enter a search term or apply filters to find venues
                      </h2>
                    </div>
                  ) : (
                    <VenueGrid
                      venues={venues}
                      loading={loading}
                      totalCount={totalCount}
                      page={currentPage}
                      perPage={filters.per_page}
                      onLoadMore={handleLoadMore}
                      onVenueSaved={fetchSavedVenues}
                    />
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="saved">
              <div className="py-8">
                <h2 className="text-2xl font-bold mb-6">Saved Venues</h2>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <p className="text-muted-foreground">Loading saved venues...</p>
                    </div>
                  </div>
                ) : (
                  <VenueGrid
                    venues={savedVenues}
                    loading={loading}
                    totalCount={savedVenues.length}
                    page={1}
                    perPage={savedVenues.length}
                    onLoadMore={() => {}}
                    onVenueSaved={fetchSavedVenues}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
}
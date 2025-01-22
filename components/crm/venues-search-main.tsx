import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { VenueSearchFilters } from '@/app/types/venue';
import VenueSearchHeader from '@/components/crm/venue-search-header';
import VenueSearchFiltersComponent from '@/components/crm/venue-search-filters';
import VenueGrid from '@/components/crm/venue-grid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useSupabase } from '@/components/providers/supabase-client-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

export default function VenuesSearchMain() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { supabase } = useSupabase();
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [venues, setVenues] = useState<any[]>([]);
    const [savedVenues, setSavedVenues] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [hasSearched, setHasSearched] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'search');
    const searchScrollPosition = useRef(0);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [localFilters, setLocalFilters] = useState<VenueSearchFilters>({
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
    });
  
    // Fetch saved venues
    const fetchSavedVenues = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        console.log('Fetching saved venues...');
        const { data: savedVenueData, error: savedError } = await supabase
          .from('saved_venues')
          .select('venue_id');

        if (savedError) throw savedError;

        if (savedVenueData && savedVenueData.length > 0) {
          const venueIds = savedVenueData.map(sv => sv.venue_id);
          const { data: venues, error: venuesError } = await supabase
            .from('venues')
            .select('*')
            .in('id', venueIds);

          if (venuesError) throw venuesError;
          console.log('Saved venues response:', venues);
          setSavedVenues(venues || []);
        } else {
          setSavedVenues([]);
        }
      } catch (error) {
        console.error('Error fetching saved venues:', error);
        toast.error('Failed to fetch saved venues');
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      if (isAuthenticated) {
        fetchSavedVenues();
      }
    }, [isAuthenticated]);

    const updateUrl = useCallback((filters: VenueSearchFilters) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.set(key, String(value));
        }
      });
      router.push(`/venues?${params.toString()}`);
    }, [router]);
  
    const handleSearch = async (newFilters: Partial<VenueSearchFilters>) => {
      if (!isAuthenticated) {
        toast.error('Please sign in to search venues');
        return;
      }

      // Check if there are any meaningful search criteria
      const updatedFilters = { ...localFilters, ...newFilters, page: 1 };
      const hasSearchCriteria = !!(
        updatedFilters.query ||
        updatedFilters.city ||
        updatedFilters.state ||
        updatedFilters.venue_type ||
        updatedFilters.capacity ||
        updatedFilters.verified ||
        updatedFilters.featured ||
        updatedFilters.allows_underage ||
        updatedFilters.has_bar ||
        updatedFilters.has_stage ||
        updatedFilters.has_sound_system ||
        updatedFilters.has_lighting_system ||
        updatedFilters.has_parking
      );

      if (!hasSearchCriteria && !hasSearched) {
        setVenues([]);
        setTotalCount(0);
        return;
      }

      setLoading(true);
      setHasSearched(true);
      setLocalFilters(updatedFilters);
      
      try {
        console.log('Searching venues with filters:', updatedFilters);
        let query = supabase
          .from('venues')
          .select('*', { count: 'exact' });

        // Apply filters
        if (updatedFilters.query) {
          query = query.ilike('title', `%${updatedFilters.query}%`);
        }
        if (updatedFilters.state) {
          query = query.eq('state', updatedFilters.state);
        }
        if (updatedFilters.city) {
          query = query.ilike('city', `%${updatedFilters.city}%`);
        }
        if (updatedFilters.venue_type) {
          query = query.eq('venue_type', updatedFilters.venue_type);
        }
        if (updatedFilters.verified) {
          query = query.eq('verified', true);
        }
        if (updatedFilters.featured) {
          query = query.eq('featured', true);
        }
        if (updatedFilters.allows_underage) {
          query = query.eq('allows_underage', true);
        }
        if (updatedFilters.has_bar) {
          query = query.eq('has_bar', true);
        }
        if (updatedFilters.has_stage) {
          query = query.eq('has_stage', true);
        }
        if (updatedFilters.has_sound_system) {
          query = query.eq('has_sound_system', true);
        }
        if (updatedFilters.has_lighting_system) {
          query = query.eq('has_lighting_system', true);
        }
        if (updatedFilters.has_parking) {
          query = query.eq('has_parking', true);
        }
        const capacity = Number(updatedFilters.capacity);
        if (!isNaN(capacity) && capacity > 0) {
          query = query.gte('capacity', capacity);
        }

        // Apply sorting
        query = query.order(updatedFilters.sort_by, {
          ascending: updatedFilters.sort_order === 'asc'
        });

        // Apply pagination
        const start = (updatedFilters.page - 1) * updatedFilters.per_page;
        const end = start + updatedFilters.per_page - 1;
        query = query.range(start, end);

        const { data, error, count } = await query;
        console.log('Search response:', { data, error, count });

        if (error) throw error;
        
        setVenues(data || []);
        setTotalCount(count || 0);
        setCurrentPage(1);
        
        // Update URL after data is loaded
        updateUrl(updatedFilters);
      } catch (error) {
        console.error('Error searching venues:', error);
        toast.error('Failed to search venues');
        setVenues([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };
  
    const handleLoadMore = async () => {
      if (!isAuthenticated) return;

      setLoading(true);
      const nextPage = currentPage + 1;
      const updatedFilters = { ...localFilters, page: nextPage };
      
      try {
        console.log('Loading more venues with filters:', updatedFilters);
        let query = supabase
          .from('venues')
          .select('*');

        // Apply filters
        if (updatedFilters.query) {
          query = query.ilike('title', `%${updatedFilters.query}%`);
        }
        if (updatedFilters.state) {
          query = query.eq('state', updatedFilters.state);
        }
        if (updatedFilters.city) {
          query = query.ilike('city', `%${updatedFilters.city}%`);
        }
        if (updatedFilters.venue_type) {
          query = query.eq('venue_type', updatedFilters.venue_type);
        }
        const capacity = Number(updatedFilters.capacity);
        if (!isNaN(capacity) && capacity > 0) {
          query = query.gte('capacity', capacity);
        }

        // Apply sorting
        query = query.order(updatedFilters.sort_by, {
          ascending: updatedFilters.sort_order === 'asc'
        });

        // Apply pagination
        const start = (updatedFilters.page - 1) * updatedFilters.per_page;
        const end = start + updatedFilters.per_page - 1;
        query = query.range(start, end);

        const { data, error } = await query;
        console.log('Load more response:', { data, error });

        if (error) throw error;
        
        setVenues([...venues, ...(data || [])]);
        setCurrentPage(nextPage);
      } catch (error) {
        console.error('Error loading more venues:', error);
        toast.error('Failed to load more venues');
      } finally {
        setLoading(false);
      }
    };
  
    // Only fetch initial results if there are search params and user is authenticated
    useEffect(() => {
      if (isAuthenticated) {
        // Check if there are any search parameters
        const hasSearchParams = Array.from(searchParams.entries()).some(([key, value]) => 
          value && !['tab', 'source'].includes(key)
        );

        if (hasSearchParams) {
          handleSearch(localFilters);
        }
      }
    }, [isAuthenticated]);

    // Save scroll position when switching tabs
    const handleTabChange = (value: string) => {
      if (!isAuthenticated) {
        toast.error('Please sign in to access saved venues');
        return;
      }

      if (value === 'search') {
        // Store current scroll position for saved tab
        const container = searchContainerRef.current;
        if (container) {
          searchScrollPosition.current = container.scrollTop;
        }
      }
      setActiveTab(value);
      router.push(`/venues?tab=${value}`);
    };

    // Subscribe to real-time updates for saved venues
    useEffect(() => {
      if (!isAuthenticated) return;

      const subscription = supabase
        .channel('saved_venues_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'saved_venues'
          },
          () => {
            fetchSavedVenues();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }, [isAuthenticated]);

    // Restore scroll position when component mounts
    useEffect(() => {
      const container = searchContainerRef.current;
      if (container && searchScrollPosition.current > 0) {
        container.scrollTop = searchScrollPosition.current;
      }
    }, [activeTab]);

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-muted-foreground">Please sign in to access the venue database</p>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-7xl px-0 sm:px-3 lg:px-0 py0">
        <div className="flex justify-center mb-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="flex justify-center">
              <TabsList className="w-full max-w-lg">
                <TabsTrigger value="search" className="flex-1">Search Venues</TabsTrigger>
                <TabsTrigger value="saved" className="flex-1">Saved Venues</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="search">
              <VenueSearchHeader
                query={localFilters.query}
                onSearch={(query) => handleSearch({ query })}
              />
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-64 flex-none">
                  <VenueSearchFiltersComponent
                    filters={localFilters}
                    onFilterChange={handleSearch}
                  />
                </div>
                <div className="flex-1" ref={searchContainerRef}>
                  {!hasSearched ? (
                    <div className="text-center py-12">
                      <h2 className="text-xl text-gray-400">
                        Enter a search term or apply filters to find venues
                      </h2>
                    </div>
                  ) : loading && venues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                      <p className="text-lg text-gray-400">Searching venues...</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-end mb-4">
                        <span className="text-sm text-gray-400">
                          {totalCount} {totalCount === 1 ? 'venue' : 'venues'} found
                        </span>
                      </div>
                      <VenueGrid
                        venues={venues}
                        loading={loading}
                        totalCount={totalCount}
                        page={currentPage}
                        perPage={localFilters.per_page}
                        onLoadMore={handleLoadMore}
                        onVenueSaved={fetchSavedVenues}
                        source="search"
                      />
                    </>
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
                    source="saved"
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
}
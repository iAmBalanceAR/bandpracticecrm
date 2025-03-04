'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Venue } from '@/app/types/venue';
import { Heart, MapPin, Users, Loader2, Star } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { FeedbackModal } from '@/components/ui/feedback-modal';
import { Badge } from '@/components/ui/badge';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/supabase-client-provider';
import { cn } from '@/lib/utils';
import LeadDialog from '@/app/leads/components/forms/lead-dialog';

// Import Map component with proper type
const MapComponent = dynamic(() => import('@/components/ui/map'), {
  loading: () => <div className="h-48 bg-muted animate-pulse rounded-md" />,
  ssr: false
});

interface VenueGridProps {
  venues: Venue[];
  loading: boolean;
  totalCount: number;
  page: number;
  perPage: number;
  onLoadMore: () => void;
  onVenueSaved?: () => void;
  source?: string;
}

interface SavedVenue {
  venue_id: string;
  user_id: string;
}

interface VenueLeadAssociation {
  id: string;
  venue_id: string;
}

// Add type for venue lead map
type VenueLeadMap = {
  [key: string]: string;
};

export default function VenueGrid({ 
  venues = [], 
  loading = false, 
  totalCount = 0,
  page = 1,
  perPage = 12,
  onLoadMore,
  onVenueSaved,
  source = 'search'
}: VenueGridProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { supabase } = useSupabase();
  const [loadingMore, setLoadingMore] = useState(false);
  const [savedVenues, setSavedVenues] = useState<Set<string>>(new Set());
  const [venueLeads, setVenueLeads] = useState<VenueLeadMap>({});
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
    onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
  });
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchSavedVenues();
    fetchVenueLeads();
  }, []);

  const fetchSavedVenues = async () => {
    try {
      const response = await fetch('/api/venues/saved');
      if (!response.ok) throw new Error('Failed to fetch saved venues');
      const { data } = await response.json();
      if (Array.isArray(data)) {
        setSavedVenues(new Set(data.map((sv: SavedVenue) => sv.venue_id)));
      }
    } catch (error) {
      console.error('Error fetching saved venues:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load saved venues',
        type: 'error',
        onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const fetchVenueLeads = async () => {
    try {
      // Use the get_leads stored procedure which handles auth and permissions
      const { data: leadAssociations, error } = await supabase
        .rpc('get_leads');

      if (error) {
        console.error('Error fetching leads:', error);
        return;
      }

      // Process the leads we have access to, filtering only those with venue_id
      const leadMap: VenueLeadMap = {};
      if (leadAssociations) {
        leadAssociations
          .filter((lead: any) => lead.venue_id)
          .forEach((lead: VenueLeadAssociation) => {
            leadMap[lead.venue_id] = lead.id;
          });
      }
      setVenueLeads(leadMap);
    } catch (error) {
      console.error('Error fetching venue lead associations:', error);
    }
  };

  const handleSaveVenue = async (venueId: string) => {
    const isSaved = savedVenues.has(venueId);
    try {
      const response = await fetch('/api/venues/saved', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venue_id: venueId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update saved venue');
      }

      // Update local state
      const newSavedVenues = new Set(savedVenues);
      if (isSaved) {
        newSavedVenues.delete(venueId);
      } else {
        newSavedVenues.add(venueId);
      }
      setSavedVenues(newSavedVenues);

      // Notify parent component to refresh saved venues list
      onVenueSaved?.();

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: isSaved 
          ? 'Venue has been removed from your saved list'
          : 'Venue has been added to your saved list',
        type: 'success',
        onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
      });
    } catch (error) {
      console.error('Error updating saved venue:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update saved venue',
        type: 'error',
        onClose: () => setFeedbackModal(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleCreateLead = (venue: Venue) => {
    const venueData = {
      id: venue.id,
      title: venue.title,
      city: venue.city,
      state: venue.state,
      address: venue.address,
      zip: venue.zip
    };

    return (
      <LeadDialog venue={venueData}>
        <Button
          variant="outline"
          size="sm"
          className="border-[#60A5FA] border hover:bg-blue-800 bg-blue-600 text-white"
        >
          Create Lead
        </Button>
      </LeadDialog>
    );
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await onLoadMore();
    setLoadingMore(false);
  };

  const isVenueComplete = (venue: any) => {
    const requiredFields = [
      venue.phone && venue.phone !== 'null',
      venue.email && venue.email !== 'null',
      venue.description && venue.description !== 'null',
      venue.capacity && venue.capacity !== 'null',
      venue.venuetype && venue.venuetype !== 'null'
    ];
    return requiredFields.filter(Boolean).length >= 3;
  };

  const hasMapData = (venue: any) => {
    return venue.latitude && 
           venue.longitude && 
           !isNaN(Number(venue.latitude)) && 
           !isNaN(Number(venue.longitude));
  };

  const sortVenues = (venues: any[]) => {
    return [...venues].sort((a, b) => {
      const aComplete = isVenueComplete(a);
      const bComplete = isVenueComplete(b);
      const aHasMap = hasMapData(a);
      const bHasMap = hasMapData(b);

      if (aComplete !== bComplete) return aComplete ? -1 : 1;
      if (aHasMap !== bHasMap) return aHasMap ? -1 : 1;
      return 0;
    });
  };

  const getVenueDetailUrl = (venueId: string) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('source', source);
    return `/venues/${venueId}?${currentParams.toString()}`;
  };

  if (loading && venues.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: perPage }).map((_, index) => (
          <Card key={index} className="bg-[#030817] border-blue-800 border rounded-md">
            <CardHeader className="p-0">
              <div className="h-48 w-full bg-[#1B2559] rounded-t-lg animate-pulse" />
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="h-6 w-3/4 bg-[#1B2559] animate-pulse rounded" />
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-[#1B2559] animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-[#1B2559] animate-pulse rounded" />
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-[#1B2559] animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-[#1B2559] animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!loading && (!venues || venues.length === 0)) {
    return (
      <div className="text-center py-8">
        <Users className="w-24 h-24 mx-auto mb-4 text-[#00e396]" />
        <p className="text-md text-gray-400">No saved venues found.<br />Use the search tab to find venues and save them for later.</p>
      </div>
    );
  }

  const hasMore = venues.length < totalCount;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortVenues(venues).map((venue) => (
          <Card key={venue.id} className="bg-[#030817] border-blue-400 border-2 rounded-md overflow-hidden group relative">
            {isVenueComplete(venue) && (
              <div className="absolute top-2 right-2 z-[2]">
                <Badge variant="default" className="bg-blue-500">
                  <Star className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              </div>
            )}
            <Link href={getVenueDetailUrl(venue.id)} className="block">
              <CardHeader className="p-0 relative">
                {hasMapData(venue) && (
                  <div className="h-48 w-full relative z-[1]">
                    <MapComponent
                      center={[Number(venue.latitude), Number(venue.longitude)]}
                      zoom={14}
                      className="h-full w-full"
                      markers={[{
                        position: [Number(venue.latitude), Number(venue.longitude)],
                        title: venue.title
                      }]}
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold group-hover:text-blue-400">{venue.title}</h3>
                  <div className="relative z-[2]" onClick={(e) => e.preventDefault()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-[#1B2559]"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSaveVenue(venue.id);
                      }}
                    >
                      <Heart 
                        className={cn(
                          "h-5 w-5",
                          savedVenues.has(venue.id) ? "fill-red-500 text-red-500" : "text-gray-400"
                        )}
                      />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {venue.city && venue.state && (
                    <div className="flex items-center text-gray-400">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{venue.city}, {venue.state}</span>
                    </div>
                  )}
                  {venue.capacity && (
                    <div className="flex items-center text-gray-400">
                      <Users className="h-4 w-4 mr-2" />
                      <span>Capacity: {venue.capacity}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Link>
            <CardFooter className="p-4 pt-0 flex justify-end relative z-[2]">
              {venue.id in venueLeads ? (
                <Link href={`/leads/${venueLeads[venue.id]}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#60A5FA] border bg-green-800 hover:bg-green-900 text-white"
                  >
                    Active Lead
                  </Button>
                </Link>
              ) : source !== 'search' ? (
                handleCreateLead(venue)
              ) : null}
            </CardFooter>
          </Card>
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="min-w-[200px]"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        onClose={feedbackModal.onClose}
      />
    </div>
  );
} 
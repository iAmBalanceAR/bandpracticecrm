'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Venue } from '@/app/types/venue';
import { Heart, MapPin, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { FeedbackModal } from '@/components/ui/feedback-modal';

const Map = dynamic(() => import('@/components/ui/map'), {
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
}

interface SavedVenue {
  venue_id: string;
  user_id: string;
}

export default function VenueGrid({ 
  venues = [], 
  loading = false, 
  totalCount = 0,
  page = 1,
  perPage = 12,
  onLoadMore,
  onVenueSaved
}: VenueGridProps) {
  const { toast } = useToast();
  const [loadingMore, setLoadingMore] = useState(false);
  const [savedVenues, setSavedVenues] = useState<Set<string>>(new Set());
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    fetchSavedVenues();
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
        type: 'error'
      });
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
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating saved venue:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update saved venue',
        type: 'error'
      });
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await onLoadMore();
    setLoadingMore(false);
  };

  if (loading && venues.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <p className="text-lg text-gray-400">No venues found matching your criteria.</p>
      </div>
    );
  }

  const hasMore = venues.length < totalCount;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map((venue) => (
          <Card key={venue.id} className="bg-[#030817] border-blue-400 border-2 rounded-md overflow-hidden group relative">
            <Link href={`/venues/${venue.id}`} className="block">
              <CardHeader className="p-0 relative">
                {venue.latitude && 
                 venue.longitude && 
                 !isNaN(Number(venue.latitude)) && 
                 !isNaN(Number(venue.longitude)) && (
                  <div className="h-48 w-full relative">
                    <Map
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
                  <div className="relative z-10" onClick={(e) => e.preventDefault()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 hover:bg-[#1B2559]"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSaveVenue(venue.id);
                      }}
                    >
                      <Heart 
                        className={savedVenues.has(venue.id) ? 'fill-red-500 text-red-500' : 'text-white'} 
                      />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-400 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {venue.city}, {venue.state}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <Users className="h-4 w-4 mr-1" />
                  Capacity: {venue.capacity?.toLocaleString() || 'N/A'}
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading more venues...
              </>
            ) : (
              'Load More Venues'
            )}
          </Button>
        </div>
      )}

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
      />
    </div>
  );
} 
'use client';

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Users } from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Venue } from '@/app/types/venue';

// Dynamically import Map with loading state
const Map = dynamic(() => import('@/components/ui/map'), {
  loading: () => <div className="h-32 bg-muted animate-pulse rounded-md" />,
  ssr: false
});

export default function VenueGrid({ venues = [] }: { venues: Venue[] }) {
  const { toast } = useToast();
  const [savedVenues, setSavedVenues] = useState<Set<string>>(new Set());
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  useEffect(() => {
    const fetchSavedVenues = async () => {
      try {
        setIsLoadingSaved(true);
        const response = await fetch('/api/venues/saved');
        
        if (!response.ok) {
          throw new Error('Failed to fetch saved venues');
        }
        
        const { data } = await response.json();
        if (Array.isArray(data)) {
          setSavedVenues(new Set(data.map(item => item.venue_id)));
        } else {
          console.error('Saved venues data is not an array:', data);
          setSavedVenues(new Set());
        }
      } catch (error) {
        console.error('Error fetching saved venues:', error);
        toast({
          title: "Error",
          description: "Failed to load saved venues",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSaved(false);
      }
    };

    fetchSavedVenues();
  }, [toast]);

  const handleSaveVenue = async (venueId: string) => {
    try {
      const response = await fetch('/api/venues/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venue_id: venueId }),
      });

      if (!response.ok) throw new Error('Failed to save venue');

      setSavedVenues(prev => {
        const next = new Set(prev);
        if (next.has(venueId)) {
          next.delete(venueId);
        } else {
          next.add(venueId);
        }
        return next;
      });

    } catch (error) {
      console.error('Error saving venue:', error);
      toast({
        title: "Error",
        description: "Failed to save venue",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {venues.map((venue) => (
        <Card key={venue.id} className="bg-[#131d43] border-none overflow-hidden">
          <CardHeader className="p-0 relative">
            {venue.latitude && venue.longitude && (
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
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
              onClick={() => handleSaveVenue(venue.id)}
              disabled={isLoadingSaved}
            >
              <Heart 
                className={savedVenues.has(venue.id) ? 'fill-red-500 text-red-500' : 'text-white'} 
              />
            </Button>
          </CardHeader>

          <CardContent className="p-4">
            <Link href={`/venues/${venue.id}`}>
              <h3 className="text-xl font-semibold mb-2 hover:text-blue-400 transition-colors">
                {venue.title}
              </h3>
            </Link>
            
            <div className="flex items-center text-gray-400 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">
                {venue.city}, {venue.state}
              </span>
            </div>
            
            {venue.capacity && (
              <div className="flex items-center text-gray-400">
                <Users className="h-4 w-4 mr-1" />
                <span className="text-sm">Capacity: {venue.capacity}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 
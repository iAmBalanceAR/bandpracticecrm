'use client'

import * as React from "react"
import { ExternalLink, Heart, Loader2, Users } from 'lucide-react'
import { Button } from "@/components/ui/button"
import CustomCard from "@/components/common/CustomCard"
import { useState, useEffect } from "react"
import { Venue } from "@/app/types/venue"
import Link from "next/link"
import { FeedbackModal } from "@/components/ui/feedback-modal"
import { useDeleteConfirmation } from "@/hooks/use-delete-confirmation"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/components/providers/supabase-client-provider'

interface SavedVenuesCardProps {
  onVenueSaved?: () => void;
}

interface SavedVenueResponse {
  id: number;
  venue_id: string;
  created_date: string;
  venue: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    latitude: string;
    longitude: string;
    capacity: string;
    verified: string;
    [key: string]: any; // for other fields
  };
}

export default function SavedVenuesCard({ onVenueSaved }: SavedVenuesCardProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const { deleteConfirmation, showDeleteConfirmation } = useDeleteConfirmation();
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { supabase } = useSupabase()
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

  const fetchSavedVenues = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const { data: savedVenues, error } = await supabase
        .from('saved_venues')
        .select(`
          id,
          venue_id,
          created_date,
          venue:venues (*)
        `)
        .order('created_date', { ascending: false })
        .limit(5) as { data: SavedVenueResponse[] | null, error: any };

      if (error) throw error;

      const venues = (savedVenues || []).map(sv => ({
        id: sv.venue_id,
        title: sv.venue.title || '',
        address: sv.venue.address || '',
        city: sv.venue.city || '',
        state: sv.venue.state || '',
        zip: sv.venue.zip || '',
        latitude: sv.venue.latitude,
        longitude: sv.venue.longitude,
        verified: sv.venue.verified === 'true',
        capacity: sv.venue.capacity ? parseInt(sv.venue.capacity) : undefined,
        created_at: sv.created_date,
        updated_at: sv.created_date
      } satisfies Venue));
      
      setVenues(venues);
    } catch (error) {
      console.error('Error fetching saved venues:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load saved venues. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedVenues();
    }
  }, [isAuthenticated]);

  const handleUnsaveVenue = async (venueId: string) => {
    if (!isAuthenticated) {
      setFeedbackModal({
        isOpen: true,
        title: 'Authentication Required',
        message: 'Please sign in to manage saved venues',
        type: 'error'
      });
      return;
    }

    showDeleteConfirmation(venueId, {
      title: 'Remove Saved Venue',
      message: 'Are you sure you want to remove this venue from your saved list? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('saved_venues')
            .delete()
            .eq('venue_id', venueId);

          if (error) throw error;

          setFeedbackModal({
            isOpen: true,
            title: 'Success',
            message: 'Venue has been removed from your saved list',
            type: 'success'
          });

          fetchSavedVenues();
          onVenueSaved?.();
        } catch (error) {
          console.error('Error unsaving venue:', error);
          setFeedbackModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to remove venue from saved list',
            type: 'error'
          });
        }
      }
    });
  };

  return (
    <>
      <CustomCard 
        title="Latest Saved Venues"
        cardColor="[#008ffb]"
        addclassName="h-[350x] bg-[#020817]"
      >
        <div className="bg-[#020817] h-[calc(379px-3.5rem)] overflow-y-auto rounded-lg">
          <Table className="w-full">
            <TableHeader className="text-black border-0 bg-white sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-gray-200  p-[7px] pl-4 text-left text-sm font-bold">Venue</TableHead>
                <TableHead className="text-gray-200  p-2 pl-4 text-left text-sm font-bold">City</TableHead>
                <TableHead className="text-gray-200  p-2 pl-4 text-left text-sm font-bold">State</TableHead>
                <TableHead className="text-gray-200  p-2 pl-4 text-left text-sm font-bold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>

              {authLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-4 py-8">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : !isAuthenticated ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                    Please sign in to view saved venues
                  </TableCell>
                </TableRow>
              ) : loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-4 py-8">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : venues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-4 text-[#00e396] mt-12" />
                    No Saved Venues in the Database
                  </TableCell>
                </TableRow>
              ) : (
                venues.map((venue, index) => (
                  <TableRow key={venue.id} className={cn(index % 2 === 0 ? 'bg-[#1B2559]' : 'bg-[#111C44]', 'border-0')}>
                    <TableCell className="px-4 py-2 text-xs">
                      <Link 
                        href={`/venues/${venue.id}`}
                        className="hover:text-blue-400 transition-colors"
                      >
                        {venue.title} <ExternalLink className="h-5 w-5 hover:text-blue-300 float-right" />
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-xs">{venue.city}</TableCell>
                    <TableCell className="px-4 py-2 text-xs">{venue.state}</TableCell>
                    <TableCell className="px-4 py-2 text-xs">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-[#1B2559]"
                        onClick={() => handleUnsaveVenue(venue.id)}
                      >
                        <Heart className="fill-red-500 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CustomCard>

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
      />

      <FeedbackModal
        isOpen={deleteConfirmation.isOpen}
        onClose={deleteConfirmation.onClose}
        title={deleteConfirmation.title}
        message={deleteConfirmation.message}
        type="delete"
        onConfirm={deleteConfirmation.onConfirm}
      />
    </>
  );
}
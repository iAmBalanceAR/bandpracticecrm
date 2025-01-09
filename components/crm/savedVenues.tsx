import * as React from "react"
import { Heart, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import CustomCard from "@/components/common/CustomCard"
import { useState, useEffect } from "react"
import { Venue } from "@/app/types/venue"
import Link from "next/link"
import { FeedbackModal } from "@/components/ui/feedback-modal"
import { useDeleteConfirmation } from "@/hooks/use-delete-confirmation"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface SavedVenuesCardProps {
  onVenueSaved?: () => void;
}

export default function SavedVenuesCard({ onVenueSaved }: SavedVenuesCardProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const { deleteConfirmation, showDeleteConfirmation } = useDeleteConfirmation();
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
    try {
      const response = await fetch('/api/venues/saved/list');
      if (!response.ok) throw new Error('Failed to fetch saved venues');
      const data = await response.json();
      // Only take the 5 most recent venues
      setVenues(data.venues?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching saved venues:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load saved venues',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedVenues();
  }, []);

  const handleUnsaveVenue = async (venueId: string) => {
    showDeleteConfirmation(venueId, {
      title: 'Remove Saved Venue',
      message: 'Are you sure you want to remove this venue from your saved list? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const response = await fetch('/api/venues/saved', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ venue_id: venueId }),
          });

          if (!response.ok) throw new Error('Failed to unsave venue');

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
        <div className="bg-[#020817] h-[calc(370px-3.5rem)] overflow-y-auto">
          <Table className="w-full ">
            <TableHeader className="text-black border-0 bg-white sticky top-0 z-10">
              <TableRow>
                <TableHead className="bg-white p-[7px] pl-4 text-left text-xs font-medium">Venue</TableHead>
                <TableHead className="bg-white p-2 pl-4 text-left text-xs font-medium">City</TableHead>
                <TableHead className="bg-white p-2 pl-4 text-left text-xs font-medium">State</TableHead>
                <TableHead className="bg-white p-2 pl-4 text-left text-xs font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
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
                    No saved venues found
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
                        {venue.title}
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
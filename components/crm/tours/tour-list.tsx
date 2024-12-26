'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Loader2, X, Calendar, Star } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useSupabase } from '@/components/providers/supabase-client-provider';
import { FeedbackModal } from '@/components/ui/feedback-modal';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface Tour {
  id: number;
  title: string;
  description: string;
  thumbnail: string | null;
  departure_date: string | null;
  return_date: string | null;
  status: 'Building' | 'In Progress' | 'Closed';
  session_id: string;
  created_at: string;
  last_updated: string;
  is_default: boolean;
  user_id: string;
}

export default function TourList() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const { deleteConfirmation, showDeleteConfirmation } = useDeleteConfirmation();
  const [currentTour, setCurrentTour] = useState<Tour | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [departureDate, setDepartureDate] = useState<Date>(new Date());
  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const [status, setStatus] = useState<Tour['status']>('Building');
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
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_user_tours');

      if (error) throw error;

      setTours(data || []);
    } catch (error) {
      console.error('Error fetching tours:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load tours',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTour = async (tourId: number) => {
    showDeleteConfirmation(tourId.toString(), {
      title: 'Delete Tour',
      message: 'Are you sure you want to delete this tour? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .rpc('delete_tour', { tour_id: tourId });

          if (error) throw error;

          setFeedbackModal({
            isOpen: true,
            title: 'Success',
            message: 'Tour has been deleted successfully',
            type: 'success'
          });

          fetchTours();
        } catch (error) {
          console.error('Error deleting tour:', error);
          setFeedbackModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete tour',
            type: 'error'
          });
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const tourData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        departure_date: departureDate ? format(departureDate, "yyyy-MM-dd") : null,
        return_date: returnDate ? format(returnDate, "yyyy-MM-dd") : null,
        status: status,
        is_default: isDefault
      };

      let result;
      if (currentTour) {
        const { data, error } = await supabase
          .rpc('update_tour', { 
            tour_id: currentTour.id,
            tour_data: tourData
          });

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .rpc('create_tour', { 
            tour_data: tourData
          });

        if (error) throw error;
        result = data;
      }

      setFeedbackModal({
        isOpen: true,
        title: currentTour ? "Tour Updated" : "Tour Created",
        message: currentTour 
          ? "Tour has been updated successfully" 
          : "New tour has been created successfully",
        type: 'success'
      });

      handleCloseForm();
      fetchTours();
    } catch (error) {
      console.error('Error saving tour:', error);
      setFeedbackModal({
        isOpen: true,
        title: "Error",
        message: "Failed to save tour. Please try again.",
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleEdit = (tour: Tour) => {
    setCurrentTour(tour);
    try {
      setDepartureDate(tour.departure_date ? new Date(tour.departure_date) : new Date());
      setReturnDate(tour.return_date ? new Date(tour.return_date) : new Date());
    } catch (error) {
      setDepartureDate(new Date());
      setReturnDate(new Date());
    }
    setStatus(tour.status);
    setIsDefault(tour.is_default);
    setIsFormVisible(true);
  };

  const handleAddNew = () => {
    setCurrentTour(null);
    setDepartureDate(new Date());
    setReturnDate(new Date());
    setStatus('Building');
    setIsDefault(false);
    setIsFormVisible(true);
  };

  const handleCloseForm = () => {
    setIsFormVisible(false);
    setCurrentTour(null);
  };

  const getStatusColor = (status: Tour['status']) => {
    switch (status) {
      case 'Building':
        return 'text-yellow-500';
      case 'In Progress':
        return 'text-green-500';
      case 'Closed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const handleSetDefault = async (tourId: number) => {
    try {
      const { error } = await supabase
        .rpc('set_default_tour', { p_tour_id: tourId });

      if (error) throw error;

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: 'Default tour has been updated',
        type: 'success'
      });

      fetchTours();
    } catch (error) {
      console.error('Error setting default tour:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to set default tour',
        type: 'error'
      });
    }
  };

  const handleConnectExistingGigs = async () => {
    try {
      const { data, error } = await supabase
        .rpc('connect_existing_gigs_to_default_tour');

      if (error) throw error;

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: 'Existing gigs have been connected to the default tour',
        type: 'success'
      });
    } catch (error) {
      console.error('Error connecting gigs:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to connect existing gigs to tour',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-muted-foreground">Loading tours...</p>
      </div>
    );
  }

  return (
    <div>
      <Button 
        onClick={handleAddNew}
        className="mb-4 bg-green-700 text-white hover:bg-green-600 float-right"
      >
        <Plus className="mr-2 h-4 w-4" /> Add New Tour
      </Button>
      <div className="tracking-tight text-3xl">
        <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          Tour List
        </span>
      </div>
      <div className="overflow-x-auto clear-both">
        <Table className="w-full border-l border-r border-b border-[#4A5568] text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
          <TableHeader>
            <TableRow className="bg-black hover:bg-[#1E293B] text-white text-shadow-lg -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
              <TableHead className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">Title</TableHead>
              <TableHead className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">Status</TableHead>
              <TableHead className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">Departure</TableHead>
              <TableHead className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">Return</TableHead>
              <TableHead className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">Created</TableHead>
              <TableHead className="text-white border-t border-b border-[#4A5568] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tours.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-gray-400 mb-4">No tours found</p>
                  <Button
                    onClick={handleAddNew}
                    variant="outline"
                    className="bg-[#1B2559] hover:bg-[#2a3c7d] border-none"
                  >
                    Create your first tour
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              tours.map((tour) => (
                <TableRow key={tour.id} className="hover:bg-black border-b border-[#4A5568]">
                  <TableCell className="font-medium text-gray-200 py-2">
                    <Link 
                      href={`/tours/${tour.id}`}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {tour.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-200 py-2 text-center">
                    <span className={getStatusColor(tour.status)}>
                      {tour.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-200 py-2 text-center">
                    {formatDate(tour.departure_date)}
                  </TableCell>
                  <TableCell className="text-gray-200 py-2 text-center">
                    {formatDate(tour.return_date)}
                  </TableCell>
                  <TableCell className="text-gray-200 py-2 text-center">
                    {formatDate(tour.created_at)}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex space-x-2 justify-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEdit(tour)}
                        className="hover:bg-[#2D3748] hover:text-lime-400 hover:shadow-green-400 hover:shadow-sm hover:font-semibold text-white"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteTour(tour.id)}
                        className="hover:bg-[#2D3748] hover:text-rose-500 hover:shadow-rose-500 hover:shadow-sm hover:font-semibold text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSetDefault(tour.id)}
                        className={`hover:bg-[#2D3748] hover:text-yellow-400 hover:shadow-yellow-400 hover:shadow-sm hover:font-semibold ${tour.is_default ? 'text-yellow-400' : 'text-white'}`}
                      >
                        <Star className={`w-4 h-4 ${tour.is_default ? 'fill-yellow-400' : ''}`} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isFormVisible && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="bg-[#111C44] rounded-lg w-full max-w-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-3xl font-mono mb-3">
                    <span className="w-[100%] text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                      {currentTour ? "Edit Tour" : "Add New Tour"}
                    </span>
                  </h1>
                  <Button variant="ghost" onClick={handleCloseForm}>
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Tour Title</Label>
                      <Input 
                        id="title" 
                        name="title"
                        defaultValue={currentTour?.title}
                        required 
                        className="bg-[#1B2559]" 
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        name="description"
                        defaultValue={currentTour?.description}
                        placeholder="Enter tour description" 
                        className="bg-[#1B2559] h-[100px] resize-none" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="departureDate">Departure Date</Label>
                        <div className="flex space-x-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                type="button"
                                variant="outline" 
                                className="bg-[#1B2559] hover:text-white focus:text-white hover:bg-black focus:bg-black border-grey-600 text-white w-full"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {format(departureDate, "PPP")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-[#0f1729] border-[#4A5568]">
                              <CalendarComponent
                                mode="single"
                                selected={departureDate}
                                onSelect={(date: Date | undefined) => date && setDepartureDate(date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="returnDate">Return Date</Label>
                        <div className="flex space-x-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                type="button"
                                variant="outline" 
                                className="bg-[#1B2559] hover:text-white focus:text-white hover:bg-black focus:bg-black border-grey-600 text-white w-full"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {format(returnDate, "PPP")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-[#0f1729] border-[#4A5568]">
                              <CalendarComponent
                                mode="single"
                                selected={returnDate}
                                onSelect={(date: Date | undefined) => date && setReturnDate(date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="status">Tour Status</Label>
                      <Select value={status} onValueChange={(value: Tour['status']) => setStatus(value)}>
                        <SelectTrigger className="bg-[#1B2559]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f1729] border-[#4A5568] text-white">
                          <SelectItem value="Building">Building</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2 pt-4">
                      <Checkbox 
                        id="isDefault" 
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="border-gray-400"
                      />
                      <Label 
                        htmlFor="isDefault"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Set as default tour
                      </Label>
                    </div>

                    <div className="flex space-x-4 justify-end pt-4">
                      <Button 
                        type="submit" 
                        className="bg-green-800 border border-black hover:bg-green-500 px-8 text-white"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : currentTour ? (
                          "Update Tour"
                        ) : (
                          "Create Tour"
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        onClick={handleCloseForm} 
                        className="bg-red-600 hover:bg-red-700 text-white px-8"
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
} 
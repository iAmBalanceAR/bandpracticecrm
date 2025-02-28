'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Loader2, X, Calendar, Star, Route } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useSupabase } from '@/components/providers/supabase-client-provider';
import { useAuth } from '@/components/providers/auth-provider';
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
  const { isAuthenticated, loading: authLoading } = useAuth();
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
    if (isAuthenticated) {
      fetchTours();
    }
  }, [isAuthenticated]);

  const fetchTours = async () => {
    if (!isAuthenticated) return;
    
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="bg-[#192555] border-blue-800">
        <div className="p-6 text-center text-white">
          <p className="mb-4">Please sign in to view tours.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full pr-0 md:pr-4 max-w-[100vw] overflow-x-hidden">
      {!isFormVisible ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-auto tracking-tight text-3xl">
              <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-white text-shadow-sm font-mono font-normal text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                
              </span>
            </div>
            <Button 
              onClick={handleAddNew}
              className="bg-green-700 text-white hover:bg-green-600 border border-black"
            >
              <Plus className="mr-2 h-4 w-4 md:block hidden" /> 
              <span className="hidden md:inline">Add New Tour</span>
              <span className="md:hidden">Add</span>
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-[#008ffb]" />
            </div>
          ) : tours.length === 0 ? (
            <div className="text-center text-lg py-12">
              <Route className="h-24 w-24 mb-4 mx-auto text-[#d83b34]" />
              <p className="text-gray-400 mb-4">
                No Tours in the database. <br />
                <span className="hidden md:inline">Click the "Add New Tour" button above to create one.</span>
                <span className="md:hidden">Click the "Add" button above to create one.</span>
              </p>
            </div>
          ) : (
            <div className="w-full overflow-hidden">
              {/* Desktop table view */}
              <div className="border-gray-500 border-2 rounded-lg w-full hidden md:block">
                <div className="w-full overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader className="hidden md:table-header-group">
                      <TableRow className="text-lg font-medium bg-[#1F2937] text-gray-100 text-shadow-x-2 text-shadow-y-2 text-shadow-black border-gray-500 border-b-1">
                        <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Title</TableHead>
                        <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Start Date</TableHead>
                        <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">End Date</TableHead>
                        <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Status</TableHead>
                        <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Default</TableHead>
                        <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4 pr-9 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Desktop view - Table rows */}
                      <div className="hidden md:contents">
                        {tours.map((tour) => (
                          <TableRow key={tour.id} className="bg-[#111827] hover:bg-[#030817] transition-colors border-gray-500 border-b text-base">
                            <TableCell className="font-medium text-gray-400 pt-4 pb-4">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 text-[#ff9920] mr-2" />
                                <span>{tour.title}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-400 pt-4 pb-4">
                              {formatDate(tour.departure_date)}
                            </TableCell>
                            <TableCell className="text-gray-400 pt-4 pb-4">
                              {formatDate(tour.return_date)}
                            </TableCell>
                            <TableCell className={`${getStatusColor(tour.status)} pt-4 pb-4`}>
                              {tour.status}
                            </TableCell>
                            <TableCell className="text-gray-400 pt-4 pb-4 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSetDefault(tour.id)}
                                title="Click To Set Current Default Tour"
                                className={tour.is_default ? 'text-yellow-400' : 'text-gray-400'}
                              >
                                <Star className={`h-5 w-5 ${tour.is_default ? 'fill-current' : ''}`} />
                              </Button>
                            </TableCell>
                            <TableCell className="pt-4 pb-4">
                              <div className="flex space-x-2 justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(tour)}
                                  title="Edit This Tour."
                                  className="hover:bg-[#2D3748] hover:text-lime-400 hover:shadow-green-400 hover:shadow-sm hover:font-semibold text-white"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTour(tour.id)}
                                  title="Delete This Tour.."
                                  className="hover:bg-[#2D3748] hover:text-rose-500 hover:shadow-rose-500 hover:shadow-sm hover:font-semibold text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </div>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {/* Mobile view - Cards */}
              <div className="md:hidden max-w-full overflow-x-hidden">
                {tours.map((tour) => (
                  <div key={tour.id} className="bg-[#111827] p-2 mb-4 rounded-lg border border-gray-700 shadow-md w-[97.5%] !important mx-auto !important">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center ">
                        <Calendar className="w-5 h-5 text-[#ff9920] mr-2 flex-shrink-0" />
                        <h3 className="font-medium text-white text-lg truncate">{tour.title}</h3>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(tour.id)}
                          className={`h-8 w-8 p-0 ${tour.is_default ? 'text-yellow-400' : 'text-gray-400'}`}
                        >
                          <Star className={`h-4 w-4 ${tour.is_default ? 'fill-current' : ''}`} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(tour)}
                          className="h-8 w-8 p-0 hover:bg-[#2D3748] hover:text-lime-400 text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteTour(tour.id)}
                          className="h-8 w-8 p-0 hover:bg-[#2D3748] hover:text-rose-500 text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                      <div>
                        <p className="text-gray-500">Start Date</p>
                        <p className="text-gray-300">{formatDate(tour.departure_date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">End Date</p>
                        <p className="text-gray-300">{formatDate(tour.return_date)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-gray-500">Status</p>
                      <p className={`${getStatusColor(tour.status)}`}>{tour.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-[#111C44] rounded-lg w-full p-6">
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
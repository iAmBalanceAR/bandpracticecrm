"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { Trash2, Plus, Edit2, X, Calendar, Clock, Check, ChevronsUpDown, Loader2, Star } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { gigHelpers, type GigStatus } from '@/utils/db/gigs'
import { FeedbackModal } from "@/components/ui/feedback-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/components/providers/auth-provider"
import { useDeleteConfirmation } from "@/hooks/use-delete-confirmation"
import { useDebounce } from '@/hooks/use-debounce'
import createClient from '@/utils/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import CustomSectionHeader from "@/components/common/CustomSectionHeader"

// Helper functions
const isValidDate = (date: unknown): date is Date => {
  return date instanceof Date && !isNaN(date.getTime())
}

const formatTimeOrDefault = (date: Date | null) => {
  try {
    if (!date || !isValidDate(date)) {
      console.warn('Invalid date provided to formatTimeOrDefault:', date)
      return format(new Date(), "h:mm a")
    }
    return format(date, "h:mm a")
  } catch (error) {
    console.error('Error formatting time:', error)
    return format(new Date(), "h:mm a")
  }
}

const safeSetTime = (newTime: Date, setter: React.Dispatch<React.SetStateAction<Date>>) => {
  try {
    if (!isValidDate(newTime)) {
      console.warn('Attempted to set invalid time:', newTime)
      setter(new Date())
      return
    }
    setter(newTime)
  } catch (error) {
    console.error('Error setting time:', error)
    setter(new Date())
  }
}

const handleHourChange = (value: string, currentTime: Date, setter: React.Dispatch<React.SetStateAction<Date>>) => {
  try {
    const newTime = new Date(currentTime)
    let newHours = parseInt(value)
    const isPM = newTime.getHours() >= 12
    if (isPM) {
      newHours = newHours + 12
    }
    newTime.setHours(newHours)
    safeSetTime(newTime, setter)
  } catch (error) {
    console.error('Error updating hours:', error)
  }
}

const handleMinuteChange = (value: string, currentTime: Date, setter: React.Dispatch<React.SetStateAction<Date>>) => {
  try {
    const newTime = new Date(currentTime)
    newTime.setMinutes(parseInt(value))
    safeSetTime(newTime, setter)
  } catch (error) {
    console.error('Error updating minutes:', error)
  }
}

const handleAMPMToggle = (currentTime: Date, setter: React.Dispatch<React.SetStateAction<Date>>) => {
  try {
    const newTime = new Date(currentTime)
    const hours = newTime.getHours()
    newTime.setHours(hours >= 12 ? hours - 12 : hours + 12)
    safeSetTime(newTime, setter)
  } catch (error) {
    console.error('Error toggling AM/PM:', error)
  }
}

const formatDateSafely = (dateString: string | null | undefined) => {
  try {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return format(date, "MMM dd, yyyy")
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}

const getInputValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number' && isNaN(value)) return ''
  return value.toString()
}

interface Venue {
  id: string
  title: string
  address: string
  city: string
  state: string
  zip: string
}

interface TourInfo {
  id: number;
  title: string;
  is_default: boolean;
}

interface Gig {
  id: string;
  title: string;
  venue: string;
  venue_address: string;
  venue_city: string;
  venue_state: string;
  venue_zip: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  gig_date: string;
  load_in_time: string;
  sound_check_time: string;
  set_time: string;
  set_length: string;
  gig_details: string | null;
  crew_hands_in: boolean;
  crew_hands_out: boolean;
  meal_included: boolean;
  hotel_included: boolean;
  deposit_amount: number | null;
  deposit_paid: boolean;
  contract_total: number;
  open_balance: number;
  user_id: string;
  gig_status: GigStatus;
  created_at?: string;
  updated_at?: string;
  tours?: {
    id: string;
    title: string;
  };
}

interface GigWithTour extends Omit<Gig, 'tours'> {
  tourInfo?: TourInfo | null;
}

export default function GigManagement() {
  const supabase = createClient()
  const { isAuthenticated, loading } = useAuth()
  const { deleteConfirmation, showDeleteConfirmation } = useDeleteConfirmation()
  // State
  const [gigs, setGigs] = useState<GigWithTour[]>([])
  const [currentGig, setCurrentGig] = useState<GigWithTour | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [formDate, setFormDate] = useState<Date>(new Date())
  const [loadInTime, setLoadInTime] = useState<Date>(new Date())
  const [setTime, setSetTime] = useState<Date>(new Date())
  const [soundCheckTime, setSoundCheckTime] = useState<Date>(new Date())
  const [gigStatus, setGigStatus] = useState<GigStatus>('pending')
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
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [formData, setFormData] = useState({
    venueName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingGigId, setDeletingGigId] = useState<string | null>(null)
  const [tourInfo, setTourInfo] = useState<TourInfo | null>(null)

  const debouncedSearch = useDebounce(searchValue, 300)

  const fetchTourInfo = async (gigId: string) => {
    try {
      const { data, error } = await supabase
        .from('tourconnect')
        .select(`
          tour:tours (
            id,
            title,
            is_default
          )
        `)
        .eq('gig_id', gigId)
        .single();

      if (error) throw error;
      
      if (data?.tour) {
        const tourData = data.tour as any;
        return {
          id: tourData.id,
          title: tourData.title,
          is_default: tourData.is_default
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching tour info:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadGigs = async () => {
      if (!isAuthenticated) {
        console.error('User not authenticated')
        setFeedbackModal({
          isOpen: true,
          title: 'Error',
          message: 'Please sign in to manage gigs.',
          type: 'error'
        })
        return
      }

      setIsLoading(true)
      try {
        const savedGigs = await gigHelpers.getGigs()
        
        // Fetch tour info for each gig
        const gigsWithTours = await Promise.all(
          savedGigs.map(async (gig) => ({
            ...gig,
            tourInfo: await fetchTourInfo(gig.id)
          } as GigWithTour))
        );
        
        setGigs(gigsWithTours);
      } catch (error) {
        console.error('Error loading gigs:', error)
        setFeedbackModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to load gigs. Please try again.',
          type: 'error'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    if (!loading) {
      loadGigs()
    }
  }, [isAuthenticated, loading])

  const handleVenueSearch = async (value: string) => {
    setSearchValue(value)
    if (value === '') {
      setVenues([])
      return
    }
    if (value.length > 2) {
      try {
        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .ilike('title', `%${value}%`)
          .limit(5)
        
        if (error) throw error
        setVenues(data || [])
      } catch (error) {
        console.error('Error searching venues:', error)
        setVenues([])
      }
    } else {
      setVenues([])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      
      const gigData = {
        title: formData.get("title") as string,
        venue: searchValue,
        venue_address: formData.get("venueAddress") as string,
        venue_city: formData.get("venueCity") as string,
        venue_state: formData.get("venueState") as string,
        venue_zip: formData.get("venueZip") as string,
        contact_name: formData.get("contactName") as string,
        contact_email: formData.get("contactEmail") as string,
        contact_phone: formData.get("contactPhone") as string,
        gig_date: format(formDate, "yyyy-MM-dd"),
        load_in_time: format(loadInTime, "HH:mm:ss"),
        sound_check_time: format(soundCheckTime, "HH:mm:ss"),
        set_time: format(setTime, "HH:mm:ss"),
        set_length: formData.get("setLength") as string,
        gig_details: formData.get("gigDetails") as string || undefined,
        crew_hands_in: formData.get("crewHandsIn") === "on",
        crew_hands_out: formData.get("crewHandsOut") === "on",
        meal_included: formData.get("mealIncluded") === "on",
        hotel_included: formData.get("hotelIncluded") === "on",
        deposit_amount: Number(formData.get("depositAmount")) || undefined,
        deposit_paid: formData.get("depositPaid") === "on",
        contract_total: Number(formData.get("contractTotal")),
        open_balance: Number(formData.get("openBalance")),
        user_id: '',  // This will be set by the backend
        gig_status: gigStatus
      }

      let result: GigWithTour;
      if (currentGig) {
        // First update the gig data
        const cleanedGigData = {
          title: gigData.title,
          venue: gigData.venue,
          venue_address: gigData.venue_address,
          venue_city: gigData.venue_city,
          venue_state: gigData.venue_state,
          venue_zip: gigData.venue_zip,
          contact_name: gigData.contact_name,
          contact_email: gigData.contact_email,
          contact_phone: gigData.contact_phone,
          gig_date: gigData.gig_date,
          load_in_time: gigData.load_in_time,
          sound_check_time: gigData.sound_check_time,
          set_time: gigData.set_time,
          set_length: gigData.set_length,
          gig_details: gigData.gig_details,
          crew_hands_in: gigData.crew_hands_in,
          crew_hands_out: gigData.crew_hands_out,
          meal_included: gigData.meal_included,
          hotel_included: gigData.hotel_included,
          deposit_amount: gigData.deposit_amount,
          deposit_paid: gigData.deposit_paid,
          contract_total: gigData.contract_total,
          open_balance: gigData.open_balance,
          gig_status: gigData.gig_status
        };
        const updateResult = await gigHelpers.updateGig(currentGig.id, cleanedGigData);
        
        result = {
          ...updateResult,
          tourInfo: currentGig.tourInfo
        };
      } else {
        // Create new gig
        const createResult = await gigHelpers.createGig(gigData);
        
        // Set the result first
        result = {
          ...createResult,
          tourInfo: null
        };
        
        // Then try to connect to default tour if we have a valid ID
        if (result && result.id) {
          try {
            const { error: connectError } = await supabase
              .rpc('connect_gig_to_default_tour', { 
                p_gig_id: result.id 
              });
              
            if (connectError) {
              console.error('Error connecting to default tour:', connectError);
            }
          } catch (error) {
            console.error('Error in tour connection:', error);
          }
        } else {
          throw new Error('Failed to create gig - no ID returned');
        }
      }

      setFeedbackModal({
        isOpen: true,
        title: currentGig ? "Gig Updated" : "Gig Created",
        message: currentGig 
          ? "Gig has been updated successfully" 
          : "New gig has been created successfully",
        type: 'success'
      });

      handleCloseForm();
      
      // Refresh gigs with tour info
      const savedGigs = await gigHelpers.getGigs();
      const gigsWithTours = await Promise.all(
        savedGigs.map(async (gig) => ({
          ...gig,
          tourInfo: await fetchTourInfo(gig.id)
        }))
      );
      setGigs(gigsWithTours);
    } catch (error) {
      console.error('Error saving gig:', error);
      setFeedbackModal({
        isOpen: true,
        title: "Error",
        message: "Failed to save gig. Please try again.",
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (gig: GigWithTour) => {
    if (!isAuthenticated) {
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Please sign in to edit gigs.',
        type: 'error'
      })
      return
    }

    try {
      setCurrentGig(gig)
      setIsFormVisible(true)
      setGigStatus(gig.gig_status)
      setSearchValue(gig.venue)
      setFormData({
        venueName: gig.venue,
        address: gig.venue_address,
        city: gig.venue_city,
        state: gig.venue_state,
        zip: gig.venue_zip,
      })

      // Set form date
      if (gig.gig_date) {
        setFormDate(new Date(gig.gig_date))
      }

      // Set times
      const setTimeFromString = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number)
        const date = new Date()
        date.setHours(hours)
        date.setMinutes(minutes)
        return date
      }

      if (gig.load_in_time) {
        setLoadInTime(setTimeFromString(gig.load_in_time))
      }
      if (gig.sound_check_time) {
        setSoundCheckTime(setTimeFromString(gig.sound_check_time))
      }
      if (gig.set_time) {
        setSetTime(setTimeFromString(gig.set_time))
      }
    } catch (error) {
      console.error('Error setting up edit form:', error)
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to load gig details. Please try again.',
        type: 'error'
      })
    }
  }

  const handleDeleteClick = (id: string) => {
    if (!isAuthenticated) {
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Please sign in to delete gigs.',
        type: 'error'
      })
      return
    }

    showDeleteConfirmation(id, {
      title: 'Delete Gig',
      message: 'Are you sure you want to delete this gig? This action cannot be undone.',
      onConfirm: async () => {
        try {
          setDeletingGigId(id)
          await gigHelpers.deleteGig(id)
          setGigs(prevGigs => prevGigs.filter(gig => gig.id !== id))
          setFeedbackModal({
            isOpen: true,
            title: 'Success',
            message: 'Gig deleted successfully!',
            type: 'success'
          })
        } catch (error) {
          console.error('Error deleting gig:', error)
          setFeedbackModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete gig. Please try again.',
            type: 'error'
          })
        } finally {
          setDeletingGigId(null)
        }
      }
    })
  }

  const handleAddNew = () => {
    setCurrentGig(null)
    setIsFormVisible(true)
  }

  const handleCloseForm = () => {
    setIsFormVisible(false)
    setCurrentGig(null)
  }

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue)
    setSearchValue(venue.title)
    // Get all the form elements
    const venueAddressInput = document.getElementById('venueAddress') as HTMLInputElement
    const venueCityInput = document.getElementById('venueCity') as HTMLInputElement
    const venueStateInput = document.getElementById('venueState') as HTMLInputElement
    const venueZipInput = document.getElementById('venueZip') as HTMLInputElement
    
    // Update the input values
    if (venueAddressInput) venueAddressInput.value = venue.address
    if (venueCityInput) venueCityInput.value = venue.city
    if (venueStateInput) venueStateInput.value = venue.state
    if (venueZipInput) venueZipInput.value = venue.zip
    
    setVenues([])  // Clear the dropdown
    setSearchValue(venue.title)  // Update search value with selected venue
  }

  const gigStatusSelect = (
    <div className="mb-4">
      <Label htmlFor="gigStatus">Gig Status</Label>
      <Select value={gigStatus} onValueChange={(value: GigStatus) => setGigStatus(value)}>
        <SelectTrigger className="bg-[#1B2559]">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent className="bg-[#0f1729] border-[#4A5568] text-white">
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
        <>
          <div className=" flex-auto  relative float-right  -top-8">
            <Button 
              onClick={handleAddNew}
              className="flex flex-auto bg-green-700 text-white hover:bg-green-600 place-items-end "
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Gig
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-[#008ffb]" />
            </div>
          ) : !isAuthenticated ? (
            <div className="text-center py-12 clear-both">
              <p className="text-gray-400 mb-4">Please sign in to manage gigs</p>
            </div>
          ) : gigs.length === 0 ? (
            <div className="text-center py-12 l items-center justify-center">
                         <Loader2 className="m-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
                         <p className="text-muted-foreground">Loading Gig Calendar...</p>
            </div>
          ) : (
            <div className="overflow-x-auto clear-both">
              <Table className="w-full border-l border-r border-b border-[#4A5568] text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black pt-0 mt-0">
                <TableHeader>
                  <TableRow className="bg-black hover:bg-[#1E293B] text-white text-shadow-lg -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                    <TableHead className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">
                      Gig Title
                    </TableHead>
                    <TableHead className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">
                      Venue
                    </TableHead>
                    <TableHead className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">
                      Date
                    </TableHead>
                    <TableHead className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">
                      Tour
                    </TableHead>
                    <TableHead className="text-white border-t border-b border-[#4A5568] text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gigs.map((gig) => (
                    <TableRow key={gig.id} className="hover:bg-black border-b border-[#4A5568]">
                      <TableCell className="font-medium text-gray-200 py-2">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-[#ff9920] mr-2" />
                          <span>{gig.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-200 py-2">{gig.venue}</TableCell>
                      <TableCell className="text-gray-200 py-2 text-center">
                        {formatDateSafely(gig.gig_date)}
                      </TableCell>
                      <TableCell className="text-gray-200 py-2 text-center">
                        {gig.tourInfo ? (
                          <div className="flex items-center justify-center space-x-1">
                            <span>{gig.tourInfo.title}</span>
                            {gig.tourInfo.is_default && (
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No tour</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex space-x-2 justify-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(gig)}
                            className="hover:bg-[#2D3748] hover:text-lime-400 hover:shadow-green-400 hover:shadow-sm hover:font-semibold text-white"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteClick(gig.id)}
                            className="hover:bg-[#2D3748] hover:text-rose-500 hover:shadow-rose-500 hover:shadow-sm hover:font-semibold text-red-500"
                          >
                            {deletingGigId === gig.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Dialog 
            open={isFormVisible} 
            onOpenChange={(open) => !open && handleCloseForm()}
          >
            <DialogContent className="bg-[#131d43] text-white border-blue-800 p-8 rounded-md max-w-[1200px] w-[45vw]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-white">
                  {currentGig ? "Edit Gig" : "Add New Gig"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-wrap -mx-2">
                      <div className="w-full md:w-1/2 px-2">
                        <div className="mb-4">
                          <Label htmlFor="formDate">Event Date</Label>
                          <div className="flex space-x-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  className="bg-[#1B2559] hover:text-white focus:text-white hover:bg-black focus:bg-black border-grey-600 text-white flex-1"
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {format(formDate || new Date(), "PPP")}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-[#0f1729] border-[#4A5568]">
                                <CalendarComponent
                                  mode="single"
                                  selected={formDate}
                                  onSelect={(date: Date | undefined) => date && setFormDate(date)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>                
                        </div>
                        <div className="mb-4">
                          <Label htmlFor="title">Gig Title</Label>
                          <Input 
                            id="title" 
                            name="title"
                            defaultValue={getInputValue(currentGig?.title)}
                            required 
                            className="bg-[#1B2559]" 
                          />
                        </div>
                        <div className="mb-4">
                          <Label htmlFor="venue">Venue</Label>
                          <div className="relative">
                            <Input
                              id="venue"
                              placeholder="Search venues..."
                              value={searchValue}
                              onChange={(e) => handleVenueSearch(e.target.value)}
                              className="bg-[#1B2559]"
                            />
                            {venues.length > 0 && (
                              <div className="absolute w-full z-50 top-full mt-1 bg-[#1B2559] rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                                {venues.map((venue) => (
                                  <div
                                    key={venue.id}
                                    onClick={() => handleVenueSelect(venue)}
                                    className="cursor-pointer hover:bg-[#2a3c7d] p-2 flex justify-between items-center"
                                  >
                                    <span className="font-medium">{venue.title}</span>
                                    <span className="text-sm text-gray-400 ml-2">• {venue.city}, {venue.state}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {searchValue.length > 2 && venues.length === 0 && !selectedVenue && (
                              <div className="absolute w-full z-50 top-full mt-1 bg-[#1B2559] rounded-md shadow-lg p-2">
                                No venues found
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mb-4">
                          <Label htmlFor="venueAddress">Venue Address</Label>
                          <Input 
                            id="venueAddress" 
                            name="venueAddress"
                            defaultValue={getInputValue(currentGig?.venue_address)}
                            required 
                            className="bg-[#1B2559]" 
                          />
                        </div>
                        <div className="mb-4">
                          <Label htmlFor="venueCity">Venue City</Label>
                          <Input 
                            id="venueCity" 
                            name="venueCity"
                            defaultValue={getInputValue(currentGig?.venue_city)}
                            required 
                            className="bg-[#1B2559]" 
                          />
                        </div>
                        <div className="mb-4">
                          <Label htmlFor="venueState">Venue State</Label>
                          <Input 
                            id="venueState" 
                            name="venueState"
                            defaultValue={getInputValue(currentGig?.venue_state)}
                            required 
                            className="bg-[#1B2559]" 
                          />
                        </div>
                        <div className="mb-4">
                          <Label htmlFor="venueZip">Venue Zip</Label>
                          <Input 
                            id="venueZip" 
                            name="venueZip"
                            defaultValue={getInputValue(currentGig?.venue_zip)}
                            required 
                            className="bg-[#1B2559]" 
                          />
                        </div>
                        <div className="mb-4">
                          <Label htmlFor="contactName">Contact Name</Label>
                          <Input 
                            id="contactName" 
                            name="contactName"
                            defaultValue={getInputValue(currentGig?.contact_name)}
                            required 
                            className="bg-[#1B2559]" 
                          />
                        </div>
                        <div className="mb-4">
                          <Label htmlFor="contactEmail">Contact Email</Label>
                          <Input 
                            id="contactEmail" 
                            name="contactEmail"
                            type="email"
                            defaultValue={getInputValue(currentGig?.contact_email)}
                            required 
                            className="bg-[#1B2559]" 
                          />
                        </div>
                        <div className="mb-4">
                          <Label htmlFor="contactPhone">Contact Phone</Label>
                          <Input 
                            id="contactPhone" 
                            name="contactPhone"
                            type="tel"
                            defaultValue={getInputValue(currentGig?.contact_phone)}
                            required 
                            className="bg-[#1B2559]" 
                          />
                        </div>
                      </div>
                      <div className="w-full md:w-1/2 px-2">
                        <div className="flex mt-[81px]">
                          <div className="mb-2 flex-none mr-4">
                            <Label htmlFor="loadInTime">Load In Time</Label>
                            <div className="flex space-x-2">                    
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button 
                                    type="button"
                                    variant="outline" 
                                    className="bg-[#1B2559] hover:text-white focus:text-white hover:bg-black focus:bg-black border-grey-600 text-white flex-1"
                                  >
                                    <Clock className="mr-2 h-4 w-4" />
                                    {formatTimeOrDefault(loadInTime)}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2 bg-[#0f1729] border-[#4A5568] text-white">
                                  <div className="flex space-x-2">
                                    <select
                                      value={format(loadInTime, "h")}
                                      onChange={(e) => handleHourChange(e.target.value, loadInTime, setLoadInTime)}
                                      className="w-20 bg-[#1B2559] rounded-md"
                                    >
                                      {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                                      ))}
                                    </select>

                                    <select
                                      value={format(loadInTime, "mm")}
                                      onChange={(e) => handleMinuteChange(e.target.value, loadInTime, setLoadInTime)}
                                      className="w-20 bg-[#1B2559] rounded-md"
                                    >
                                      {[...Array(60)].map((_, i) => (
                                        <option key={i} value={i.toString().padStart(2, '0')}>
                                          {i.toString().padStart(2, '0')}
                                        </option>
                                      ))}
                                    </select>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAMPMToggle(loadInTime, setLoadInTime)}
                                      className="w-20 bg-[#1B2559]"
                                    >
                                      {format(loadInTime, "a")}
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                          <div className="mb-2 flex-auto">
                            <Label htmlFor="loadInTime">Sound Check Time</Label>
                            <div className="flex space-x-2">                    
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button 
                                    type="button"
                                    variant="outline" 
                                    className="bg-[#1B2559] hover:text-white focus:text-white hover:bg-black focus:bg-black border-grey-600 text-white flex-1"
                                  >
                                    <Clock className="mr-2 h-4 w-4" />
                                    {formatTimeOrDefault(soundCheckTime)}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2 bg-[#0f1729] border-[#4A5568] text-white">
                                  <div className="flex space-x-2">
                                    <select
                                      value={format(soundCheckTime, "h")}
                                      onChange={(e) => handleHourChange(e.target.value, soundCheckTime, setSoundCheckTime)}
                                      className="w-20 bg-[#1B2559] rounded-md"
                                    >
                                      {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                                      ))}
                                    </select>

                                    <select
                                      value={format(soundCheckTime, "mm")}
                                      onChange={(e) => handleMinuteChange(e.target.value, soundCheckTime, setSoundCheckTime)}
                                      className="w-20 bg-[#1B2559] rounded-md"
                                    >
                                      {[...Array(60)].map((_, i) => (
                                        <option key={i} value={i.toString().padStart(2, '0')}>
                                          {i.toString().padStart(2, '0')}
                                        </option>
                                      ))}
                                    </select>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAMPMToggle(soundCheckTime, setSoundCheckTime)}
                                      className="w-20 bg-[#1B2559]"
                                    >
                                      {format(soundCheckTime, "a")}
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </div>
                        <div className="mt-[17px] ">
                          <div className="flex">
                            <div className="flex space-x-2 mr-4">
                              <Checkbox className="border-white border" id="crewHandsIn" name="crewHandsIn" defaultChecked={currentGig?.crew_hands_in} />
                              <Label className="" htmlFor="crewHandsIn">Hands On In</Label>
                            </div>
                            <div className="flex space-x-2">
                              <Checkbox className="border-white border" id="crewHandsOut" name="crewHandsOut" defaultChecked={currentGig?.crew_hands_out} />
                              <Label className=""  htmlFor="crewHandsOut">Hands On Out</Label>
                            </div>       
                          </div>                                       
                          <div className="flex">
                            <div className="mb-4 mr-4  mt-4 flex-none">
                              <Label htmlFor="setTime">Set Time</Label>
                              <div className="flex space-x-2">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      type="button"
                                      variant="outline" 
                                      className="bg-[#1B2559] hover:text-white focus:text-white hover:bg-black focus:bg-black border-grey-600 text-white flex-1"
                                    >
                                      <Clock className="mr-2 h-4 w-4" />
                                      {formatTimeOrDefault(setTime)}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-2 bg-[#0f1729] border-[#4A5568] text-white">
                                    <div className="flex space-x-2">
                                      <select
                                        value={format(setTime, "h")}
                                        onChange={(e) => {
                                          const newTime = new Date(setTime)
                                          let hours = parseInt(e.target.value)
                                          const isPM = newTime.getHours() >= 12
                                          if (isPM) hours = hours + 12
                                          newTime.setHours(hours)
                                          setSetTime(newTime)
                                        }}
                                        className="w-20 bg-[#1B2559] rounded-md"
                                      >
                                        {[...Array(12)].map((_, i) => (
                                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                                        ))}
                                      </select>

                                      <select
                                        value={format(setTime, "mm")}
                                        onChange={(e) => {
                                          const newTime = new Date(setTime)
                                          newTime.setMinutes(parseInt(e.target.value))
                                          setSetTime(newTime)
                                        }}
                                        className="w-20 bg-[#1B2559] rounded-md"
                                      >
                                        {[...Array(60)].map((_, i) => (
                                          <option key={i} value={i.toString().padStart(2, '0')}>
                                            {i.toString().padStart(2, '0')}
                                          </option>
                                        ))}
                                      </select>

                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newTime = new Date(setTime)
                                          const hours = newTime.getHours()
                                          newTime.setHours(hours >= 12 ? hours - 12 : hours + 12)
                                          setSetTime(newTime)
                                        }}
                                        className="w-20 bg-[#1B2559]"
                                      >
                                        {format(setTime, "a")}
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>   
                              </div>                 
                            </div>                 
                            <div className="mb-4 mt-4 flex-auto">
                              <Label htmlFor="setLength">Set Length (Hours)</Label>
                              <Input 
                                id="setLength" 
                                name="setLength"
                                defaultValue={getInputValue(currentGig?.set_length)}
                                required 
                                className="bg-[#1B2559]" 
                              />
                            </div>
                          </div>
                          <div className="mb-4">
                            <Label htmlFor="depositAmount">Deposit Amount (USD)</Label>
                            <Input 
                              className="bg-[#1B2559]" 
                              id="depositAmount" 
                              name="depositAmount" 
                              type="number" 
                              defaultValue={getInputValue(currentGig?.deposit_amount)}
                              required 
                            />
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center space-x-2 ">
                              <Checkbox className="border-white border" id="depositPaid" name="depositPaid" defaultChecked={currentGig?.deposit_paid} />
                              <Label htmlFor="depositPaid">Deposit Paid</Label>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-4 mb-4">
                            <div className="flex items-center space-x-2 mt-4">
                              <Checkbox className="border-white border" id="hotelIncluded" name="hotelIncluded" defaultChecked={currentGig?.hotel_included} />
                              <Label htmlFor="hotelIncluded">Hotel Included</Label>
                            </div>
                            <div className="flex items-center space-x-2 mt-3">
                              <Checkbox className="border-white border" id="mealIncluded" name="mealIncluded" defaultChecked={currentGig?.meal_included} />
                              <Label htmlFor="mealIncluded">Meal Included</Label>
                            </div>
                          </div>
                          <div className="mb-4">
                            <Label htmlFor="totalPayout">Contract Total</Label>
                            <Input id="totalPayout" name="contractTotal" type="number" defaultValue={currentGig?.contract_total} required className="bg-[#1B2559]" />
                          </div>
                          <div className="mb-4">
                            <Label htmlFor="OpenBalance">Open Balance</Label>
                            <Input id="openBalance" name="openBalance" type="number" defaultValue={currentGig?.open_balance} required className="bg-[#1B2559]" />
                          </div>                  
                          <div className="mb-3">
                            <Label htmlFor="gigDetails">Gig Details</Label>
                            <Textarea 
                              id="gigDetails" 
                              name="gigDetails"
                              defaultValue={getInputValue(currentGig?.gig_details)}
                              placeholder="Enter gig details" 
                              className="bg-[#1B2559] h-[135px]  resize-none" 
                            />
                          </div>
                          <div className="flex space-x-4 justify-end mt-6">
                            <Button type="submit" className="bg-green-800 border border-black hover:bg-green-500 px-8 text-white">
                              {currentGig ? "Update Gig" : "Add Gig"}
                            </Button>
                            <Button type="button" onClick={handleCloseForm} className="bg-red-600 hover:bg-red-700 text-white px-8">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>     
         </DialogContent> 
          </Dialog>  

          <FeedbackModal
            isOpen={feedbackModal.isOpen}
            onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
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
  )
}
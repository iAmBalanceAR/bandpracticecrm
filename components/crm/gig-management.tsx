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
import { useSupabase } from "@/components/providers/supabase-client-provider"
import { useDeleteConfirmation } from "@/hooks/use-delete-confirmation"
import { useDebounce } from '@/hooks/use-debounce'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import CustomSectionHeader from "@/components/common/CustomSectionHeader"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"

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
  city?: string;
  state?: string;
}

interface GigManagementProps {
  filterType: 'upcoming' | 'past';
  onAddNew: () => void;
}

export default function GigManagement({ filterType, onAddNew }: GigManagementProps) {
  const { supabase } = useSupabase();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { deleteConfirmation, showDeleteConfirmation } = useDeleteConfirmation()
  // State
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
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
  const [depositAmount, setDepositAmount] = useState<number>(0)
  const [contractTotal, setContractTotal] = useState<number>(0)
  const [openBalance, setOpenBalance] = useState<number>(0)
  const [isDepositPaid, setIsDepositPaid] = useState(false)

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

  const loadGigs = useCallback(async () => {
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
      
      // Filter gigs based on date - using start of current day for comparison
      const currentDate = new Date()
      currentDate.setHours(0, 0, 0, 0)

      const filteredGigs = savedGigs.filter(gig => {
        if (!gig.gig_date) return false
        const gigDate = new Date(gig.gig_date + 'T00:00:00')
        
        if (activeTab === 'upcoming') {
          return gigDate.getTime() >= currentDate.getTime()
        } else {
          return gigDate.getTime() < currentDate.getTime()
        }
      })

      // Sort gigs by date
      const sortedGigs = filteredGigs.sort((a, b) => {
        const dateA = new Date(a.gig_date + 'T00:00:00')
        const dateB = new Date(b.gig_date + 'T00:00:00')
        return activeTab === 'upcoming' 
          ? dateA.getTime() - dateB.getTime()  // Ascending for upcoming
          : dateB.getTime() - dateA.getTime()  // Descending for past
      })

      const gigsWithTours = await Promise.all(
        sortedGigs.map(async (gig) => ({
          ...gig,
          tourInfo: await fetchTourInfo(gig.id)
        }))
      )
      
      setGigs(gigsWithTours)
    } catch (error) {
      // Only show error if it's not a "no tours" error
      if (error instanceof Error && !error.message.includes('No default tour found')) {
        console.error('Error loading gigs:', error)
        setFeedbackModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to load gigs. Please try again.',
          type: 'error'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, activeTab, supabase])

  useEffect(() => {
    if (!authLoading) {
      loadGigs()
    }
  }, [authLoading, loadGigs])

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
      await loadGigs();
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
      
      // Set financial fields
      setDepositAmount(gig.deposit_amount || 0)
      setContractTotal(gig.contract_total || 0)
      setOpenBalance(gig.open_balance || 0)
      setIsDepositPaid(gig.deposit_paid || false)

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

  const handleAddNew = async () => {
    // Check if tours exist and if a default tour is set before allowing a user to add a calendar entry
    try {
      // Use the existing supabase client from the hook
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setFeedbackModal({
          isOpen: true,
          title: 'Authentication Error',
          message: 'You need to be signed in to add calendar entries. Please sign in and try again.',
          type: 'error'
        })
        return
      }

      // First check if any tours exist
      const { data: tours, error: toursError } = await supabase
        .from('tours')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
      
      if (toursError) {
        console.error('Error checking for tours:', toursError)
        setFeedbackModal({
          isOpen: true,
          title: 'Database Error',
          message: `Unable to check for tours: ${toursError.message || 'Unknown database error'}. Please try again or contact support if the issue persists.`,
          type: 'error'
        })
        return
      }
      
      if (!tours || tours.length === 0) {
        // No tours exist, show error message with instructions
        setFeedbackModal({
          isOpen: true,
          title: 'No Tours Available',
          message: 'You need to create a tour before adding calendar entries. Please go to the Tour Management page and create a tour first.',
          type: 'error'
        })
        return
      }
      
      // Now check if a default tour is set
      const { data: defaultTour, error: defaultTourError } = await supabase
        .from('tours')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()
      
      if (defaultTourError) {
        console.error('Error checking for default tour:', defaultTourError)
        
        // Check for the specific error message about JSON object/multiple rows
        if (defaultTourError.message.includes('JSON object requested') || 
            defaultTourError.message.includes('multiple') || 
            defaultTourError.message.includes('no rows')) {
          setFeedbackModal({
            isOpen: true,
            title: 'No Default Tour Selected',
            message: 'Please set a default tour by clicking the star icon next to a tour in the Tour Management page. You need a default tour before adding calendar entries.',
            type: 'error'
          })
        } else {
          // Other database error
          setFeedbackModal({
            isOpen: true,
            title: 'Database Error',
            message: `Unable to check for default tour. Please try again or contact support if the issue persists.`,
            type: 'error'
          })
        }
        return
      }
      
      // Default tour exists, proceed with adding a new calendar entry
      setCurrentGig(null)
      setIsFormVisible(true)
    } catch (error: any) {
      // Handle unexpected errors with more detailed information
      console.error('Unexpected error checking for tours:', error)
      
      let errorMessage = 'An unexpected error occurred while checking for tours.';
      
      // Add more context based on the error type
      if (error.message) {
        errorMessage += ` Error details: ${error.message}`;
      }
      
      if (error.code) {
        errorMessage += ` (Error code: ${error.code})`;
      }
      
      errorMessage += ' Please try again or contact support if the issue persists.';
      
      setFeedbackModal({
        isOpen: true,
        title: 'System Error',
        message: errorMessage,
        type: 'error'
      })
    }
  }

  const handleCloseForm = () => {
    setIsFormVisible(false)
    setCurrentGig(null)
    // Reset financial fields
    setDepositAmount(0)
    setContractTotal(0)
    setOpenBalance(0)
    setIsDepositPaid(false)
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

  // Add calculation effect
  useEffect(() => {
    let calculatedBalance = contractTotal
    if (isDepositPaid && depositAmount > 0) {
      calculatedBalance = contractTotal - depositAmount
    }
    setOpenBalance(calculatedBalance)
  }, [contractTotal, depositAmount, isDepositPaid])

  return (
    <div className="max-w-[100vw] overflow-x-hidden">
      {!isFormVisible ? (
        <>
          <CardHeader className="pb-0 mb-0">
            <CardTitle className="flex justify-between items-center text-3xl font-bold">
              <div className="flex flex-auto tracking-tight text-3xl">
                <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-white text-shadow-sm font-mono font-normal text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                  Booked Gigs
                </span>
              </div>
              <Button 
                onClick={handleAddNew}
                className="bg-green-700 text-white hover:bg-green-600 border border-black"
              >
                <Plus className="mr-2 h-4 w-4 md:block hidden" /> 
                <span className="hidden md:inline">Add New Gig</span>
                <span className="md:hidden">Add</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mx-auto max-w-7xl px-0 sm:px-2 lg:px-0 py0">
              <div className="flex justify-center mb-8">
                <Tabs 
                  defaultValue="upcoming"
                  className="w-full mt-4"
                  onValueChange={(value) => setActiveTab(value as 'upcoming' | 'past')}
                >
                  <div className="flex justify-center">
                    <TabsList className="w-full max-w-lg">
                      <TabsTrigger 
                        value="upcoming"
                        className="data-[state=active]:bg-[#111C44] data-[state=active]:text-white text-gray-400 flex-1"
                      >
                        Upcoming Gigs
                      </TabsTrigger>
                      <TabsTrigger 
                        value="past"
                        className="data-[state=active]:bg-[#111C44] data-[state=active]:text-white text-gray-400 flex-1"
                      >
                        Past Gigs
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="upcoming">
                    <div className="overflow-x-auto hidden md:block">
                      <div className="border-gray-500 border-2 rounded-lg">
                        <Table className="w-full">
                          <TableHeader className="hidden md:table-header-group">
                            <TableRow className="text-lg font-medium bg-[#1F2937] text-gray-100 text-shadow-x-2 text-shadow-y-2 text-shadow-black border-gray-500 border-b-1">
                              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Title</TableHead>
                              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Venue</TableHead>
                              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Date</TableHead>
                              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb- ">Tour</TableHead>
                              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4 text-center pr-9">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoading ? (
                              <TableRow>
                                <TableCell colSpan={5} className="h-24">
                                  <div className="flex justify-center items-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#008ffb]" />
                                    <span className="ml-2 text-gray-400">Loading gigs...</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : gigs.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-lg text-gray-400">
                                  <Calendar className="h-24 w-24 text-[#ff9920] mb-4 mx-auto" />
                                  No gigs found in the database. <br />Ensure you have created a tour and then: <br />Click the "Add New Gig" button above to create one.
                                </TableCell>
                              </TableRow>
                            ) : (
                              <>
                                {/* Desktop view - Table rows */}
                                {gigs.map((gig) => (
                                  <TableRow key={gig.id} className="bg-[#111827] hover:bg-[#030817] transition-colors border-gray-500 border-b text-base hidden md:table-row">
                                    <TableCell className="font-medium text-gray-400 pt-4 pb-4">
                                      <div className="flex items-center">
                                        <Calendar className="w-4 h-4 text-[#ff9920] mr-2" />
                                        <span className="line-clamp-1">{gig.title}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-gray-400 pt-4 pb-4">
                                      <div className="flex flex-col">
                                      <span className="whitespace-nowrap">{gig.venue}</span>
                                        {(gig.venue_city || gig.venue_state) && (
                                          <span className="text-xs text-gray-500">
                                            {[gig.venue_city, gig.venue_state].filter(Boolean).join(', ')}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-gray-400 pt-4 pb-4">
                                      <span className="whitespace-nowrap">{formatDateSafely(gig.gig_date)}</span>
                                    </TableCell>
                                    <TableCell className="text-gray-400 pt-4 pb-4">
                                      {gig.tourInfo ? (
                                        <div className="flex space-x-1">
                                          <span className="whitespace-nowrap">{gig.tourInfo.title}</span>
                                          {gig.tourInfo.is_default && (
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">No tour</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="pt-4 pb-4">
                                      <div className="flex space-x-2 w-full mx-auto">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          title="Click to Edit Gig"
                                          onClick={() => handleEdit(gig)}
                                          className="hover:bg-[#2D3748] hover:text-lime-400 hover:shadow-green-400 hover:shadow-sm hover:font-semibold text-white"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          onClick={() => handleDeleteClick(gig.id)}
                                          title="Click to Delete Gig"
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
                              </>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    {/* Mobile view - Cards */}
                    <div className="md:hidden max-w-full overflow-x-hidden mt-4">
                      {isLoading ? (
                        <div className="flex justify-center items-center h-24">
                          <Loader2 className="h-8 w-8 animate-spin text-[#008ffb]" />
                          <span className="ml-2 text-gray-400">Loading gigs...</span>
                        </div>
                      ) : gigs.length === 0 ? (
                        <div className="h-24 text-center text-lg text-gray-400">
                          <Calendar className="h-24 w-24 text-[#ff9920] mb-4 mx-auto" />
                          No gigs found in the database. <br />Ensure you have created a tour and then: <br />Click the "Add" button above to create one.
                        </div>
                      ) : (
                        gigs.map((gig) => (
                          <div key={gig.id} className="bg-[#111827] p-2 mb-4 rounded-lg border border-gray-700 shadow-md w-[97.5%] !important mx-auto !important">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                <Calendar className="w-5 h-5 text-[#ff9920] mr-2 flex-shrink-0" />
                                <h3 className="font-medium text-white text-lg truncate">{gig.title}</h3>
                              </div>
                              <div className="flex space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEdit(gig)}
                                  className="h-8 w-8 p-0 hover:bg-[#2D3748] hover:text-lime-400 text-white"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteClick(gig.id)}
                                  className="h-8 w-8 p-0 hover:bg-[#2D3748] hover:text-rose-500 text-red-500"
                                >
                                  {deletingGigId === gig.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                              <div>
                                <p className="text-gray-500">Date</p>
                                <p className="text-gray-300">{formatDateSafely(gig.gig_date)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Tour</p>
                                <div className="flex items-center">
                                  <p className="text-gray-300 truncate mr-1">
                                    {gig.tourInfo ? gig.tourInfo.title : 'No tour'}
                                  </p>
                                  {gig.tourInfo?.is_default && (
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <p className="text-gray-500">Venue</p>
                              <p className="text-gray-300">{gig.venue}</p>
                              {(gig.venue_city || gig.venue_state) && (
                                <p className="text-xs text-gray-500">
                                  {[gig.venue_city, gig.venue_state].filter(Boolean).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="past">
                    <div className="overflow-x-auto hidden md:block">
                      <div className="border-gray-500 border-2 rounded-lg">
                        <Table className="w-full">
                          <TableHeader className="hidden md:table-header-group">
                            <TableRow className="text-lg font-medium bg-[#1F2937] text-gray-100 text-shadow-x-2 text-shadow-y-2 text-shadow-black border-gray-500 border-b-1">
                              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Title</TableHead>
                              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Venue</TableHead>
                              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Date</TableHead>
                              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Tour</TableHead>
                              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4 text-right pr-9">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoading ? (
                              <TableRow>
                                <TableCell colSpan={5} className="h-24">
                                  <div className="flex justify-center items-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#008ffb]" />
                                    <span className="ml-2 text-gray-400">Loading gigs...</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : gigs.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-lg text-gray-400">
                                  <Calendar className="h-24 w-24 text-[#ff9920] mb-4 mx-auto" />
                                  No past gigs found in the database.
                                </TableCell>
                              </TableRow>
                            ) : (
                              <>
                                {/* Desktop view - Table rows */}
                                {gigs.map((gig) => (
                                  <TableRow key={gig.id} className="bg-[#111827] hover:bg-[#030817] transition-colors border-gray-500 border-b text-base hidden md:table-row">
                                    <TableCell className="font-medium text-gray-400 pt-4 pb-4">
                                      <div className="flex items-center">
                                        <Calendar className="w-4 h-4 text-[#ff9920] mr-2" />
                                        <span>{gig.title}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-gray-400 pt-4 pb-4">
                                      <div className="flex flex-col">
                                        <span>{gig.venue}</span>
                                        {(gig.venue_city || gig.venue_state) && (
                                          <span className="text-xs text-gray-500">
                                            {[gig.venue_city, gig.venue_state].filter(Boolean).join(', ')}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-gray-400 pt-4 pb-4">
                                      {formatDateSafely(gig.gig_date)}
                                    </TableCell>
                                    <TableCell className="text-gray-400 pt-4 pb-4">
                                      {gig.tourInfo ? (
                                        <div className="flex space-x-1">
                                          <span>{gig.tourInfo.title}</span>
                                          {gig.tourInfo.is_default && (
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">No tour</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="pt-4 pb-4">
                                      <div className="flex space-x-2 justify-center">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          title="Edit this Gig"
                                          onClick={() => handleEdit(gig)}
                                          className="hover:bg-[#2D3748] hover:text-lime-400 hover:shadow-green-400 hover:shadow-sm hover:font-semibold text-white"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          title="Delete this gig."
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
                              </>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    {/* Mobile view - Cards for past gigs */}
                    <div className="md:hidden max-w-full overflow-x-hidden mt-4">
                      {isLoading ? (
                        <div className="flex justify-center items-center h-24">
                          <Loader2 className="h-8 w-8 animate-spin text-[#008ffb]" />
                          <span className="ml-2 text-gray-400">Loading gigs...</span>
                        </div>
                      ) : gigs.length === 0 ? (
                        <div className="h-24 text-center text-lg text-gray-400">
                          <Calendar className="h-24 w-24 text-[#ff9920] mb-4 mx-auto" />
                          No past gigs found in the database.
                        </div>
                      ) : (
                        gigs.map((gig) => (
                          <div key={gig.id} className="bg-[#111827] p-2 mb-4 rounded-lg border border-gray-700 shadow-md w-[97.5%] !important mx-auto !important">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                <Calendar className="w-5 h-5 text-[#ff9920] mr-2 flex-shrink-0" />
                                <h3 className="font-medium text-white text-lg truncate">{gig.title}</h3>
                              </div>
                              <div className="flex space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEdit(gig)}
                                  className="h-8 w-8 p-0 hover:bg-[#2D3748] hover:text-lime-400 text-white"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteClick(gig.id)}
                                  className="h-8 w-8 p-0 hover:bg-[#2D3748] hover:text-rose-500 text-red-500"
                                >
                                  {deletingGigId === gig.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                              <div>
                                <p className="text-gray-500">Date</p>
                                <p className="text-gray-300">{formatDateSafely(gig.gig_date)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Tour</p>
                                <div className="flex items-center">
                                  <p className="text-gray-300 truncate mr-1">
                                    {gig.tourInfo ? gig.tourInfo.title : 'No tour'}
                                  </p>
                                  {gig.tourInfo?.is_default && (
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <p className="text-gray-500">Venue</p>
                              <p className="text-gray-300">{gig.venue}</p>
                              {(gig.venue_city || gig.venue_state) && (
                                <p className="text-xs text-gray-500">
                                  {[gig.venue_city, gig.venue_state].filter(Boolean).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </>
      ) : (
        <CardContent>
          <div className="bg-[#111C44] rounded-lg w-full p-6">
            <div className="mb-4">
              <h2 className="text-3xl font-mono">
                <span className="w-[100%] text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                  {currentGig ? "Edit Gig" : "Add New Gig"}
                </span>
              </h2>
            </div>
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
                      {searchValue.length > 2 && venues.length === 0 && !selectedVenue && !currentGig && (
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
                                type="button"
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
                                  type="button"
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
                          className="bg-[#1B2559]" 
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-0 mb-4">
                      <div className="flex items-center space-x-2 mt-4">
                        <Checkbox 
                          className="border-white border" 
                          id="hotelIncluded" 
                          name="hotelIncluded" 
                          defaultChecked={currentGig?.hotel_included} 
                        />
                        <Label htmlFor="hotelIncluded">Hotel Included</Label>
                      </div>
                      <div className="flex items-center space-x-2 mt-3">
                        <Checkbox 
                          className="border-white border" 
                          id="mealIncluded" 
                          name="mealIncluded" 
                          defaultChecked={currentGig?.meal_included} 
                        />
                        <Label htmlFor="mealIncluded">Meal Included</Label>
                      </div>
                    </div>
                    <div className="mb-4">
                      <Label htmlFor="totalPayout">Contract Total</Label>
                      <Input 
                        id="totalPayout" 
                        name="contractTotal" 
                        type="number" 
                        value={contractTotal}
                        onChange={(e) => setContractTotal(Number(e.target.value))}
                        className="bg-[#1B2559]" 
                      />
                    </div>
                    <div className="mb-4">
                      <Label htmlFor="depositAmount">Deposit Amount (USD)</Label>
                      <Input 
                        className="bg-[#1B2559]" 
                        id="depositAmount" 
                        name="depositAmount" 
                        type="number" 
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                      />
                    </div>
                    <div className="mt-2 mb-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          className="border-white border" 
                          id="depositPaid" 
                          name="depositPaid" 
                          checked={isDepositPaid}
                          onChange={(e) => {
                            const newCheckedState = e.target.checked;
                            setIsDepositPaid(newCheckedState);
                            // Recalculate open balance immediately
                            const newBalance = newCheckedState && depositAmount > 0 
                              ? contractTotal - depositAmount 
                              : contractTotal;
                            setOpenBalance(newBalance);
                          }}
                        />
                        <Label 
                          htmlFor="depositPaid" 
                          className="cursor-pointer select-none"
                        >
                          Deposit Paid
                        </Label>
                      </div>
                    </div>
                    <div className="mb-4">
                      <Label htmlFor="OpenBalance">Open Balance</Label>
                      <Input 
                        id="openBalance" 
                        name="openBalance" 
                        type="number" 
                        value={openBalance}
                        disabled
                        className="bg-[#1B2559] opacity-50" 
                      />
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
          </div>
        </CardContent>
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
  )
}                  
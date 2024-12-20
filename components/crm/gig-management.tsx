"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { Trash2, Plus, Edit2, X, Calendar, Clock, Check, ChevronsUpDown } from 'lucide-react'
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
import { gigHelpers, type Gig, type GigStatus } from '@/utils/db/gigs'
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
import createClient, { searchVenues } from '@/utils/supabase/client'

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

export default function GigManagement() {
  const supabase = createClient()
  const { isAuthenticated, loading } = useAuth()
  const { deleteConfirmation, showDeleteConfirmation } = useDeleteConfirmation()
  // State
  const [gigs, setGigs] = useState<Gig[]>([])
  const [currentGig, setCurrentGig] = useState<Gig | null>(null)
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

  const debouncedSearch = useDebounce(searchValue, 300)

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

      try {
        const savedGigs = await gigHelpers.getGigs()
        setGigs(savedGigs)
      } catch (error) {
        console.error('Error loading gigs:', error)
        setFeedbackModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to load gigs. Please try again.',
          type: 'error'
        })
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
      gig_details: formData.get("gigDetails") as string || null,
      crew_hands_in: formData.get("crewHandsIn") === "on",
      crew_hands_out: formData.get("crewHandsOut") === "on",
      meal_included: formData.get("mealIncluded") === "on",
      hotel_included: formData.get("hotelIncluded") === "on",
      deposit_amount: Number(formData.get("depositAmount")),
      deposit_paid: formData.get("depositPaid") === "on",
      contract_total: Number(formData.get("contractTotal")),
      open_balance: Number(formData.get("openBalance")),
      gig_status: gigStatus
    }

    try {
      let savedGig: Gig
      if (currentGig) {
        savedGig = await gigHelpers.updateGig(currentGig.id, gigData)
        setFeedbackModal({
          isOpen: true,
          title: 'Success',
          message: 'Gig updated successfully!',
          type: 'success'
        })
      } else {
        const newGig = await gigHelpers.createGig(gigData)
        if (!newGig) {
          throw new Error('Failed to create gig')
        }
        savedGig = newGig
        setFeedbackModal({
          isOpen: true,
          title: 'Success',
          message: 'New gig created successfully!',
          type: 'success'
        })
      }

      // Update gigs state with type safety
      setGigs(currentGigs => {
        const filteredGigs = currentGigs.filter(gig => gig.id !== savedGig.id)
        return [...filteredGigs, savedGig]
      })

      handleCloseForm()
    } catch (error) {
      console.error('Error saving gig:', error)
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to save gig. Please try again.',
        type: 'error'
      })
    }
  }

  const handleEdit = async (gig: Gig) => {
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
      const fullGig = await gigHelpers.getGig(gig.id)
      if (!fullGig) {
        throw new Error('Gig not found')
      }
      setCurrentGig(fullGig)
      setIsFormVisible(true)
      setGigStatus(fullGig.gig_status)
      setSearchValue(fullGig.venue)

      // Set form date
      if (fullGig.gig_date) {
        setFormDate(new Date(fullGig.gig_date))
      }

      // Set times
      const setTimeFromString = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number)
        const date = new Date()
        date.setHours(hours)
        date.setMinutes(minutes)
        return date
      }

      if (fullGig.load_in_time) {
        setLoadInTime(setTimeFromString(fullGig.load_in_time))
      }
      if (fullGig.sound_check_time) {
        setSoundCheckTime(setTimeFromString(fullGig.sound_check_time))
      }
      if (fullGig.set_time) {
        setSetTime(setTimeFromString(fullGig.set_time))
      }
    } catch (error) {
      console.error('Error loading gig details:', error)
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
          await gigHelpers.deleteGig(id)
          setGigs(gigs.filter(gig => gig.id !== id))
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
    <div className="pl-4 pt-3 bg-[#0f1729] text-white min-h-screen">
      <h1 className="text-4xl font-mono mb-3">
        <span className="w-[100%]  text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          Calander Managment
        </span>
      </h1>
      <div className="border-[#008ffb] border-b-2 -mt-7 mb-8 w-[100%] h-4"></div>
      <div className="pr-6 pl-8 pb-6 pt-4 bg-[#131d43] text-white min-h-[500px]  shadow-sm shadow-green-400 rounded-md border-blue-800 border">
        
        {!isFormVisible && (
          <>
            <Button 
              onClick={handleAddNew}
              className="mb-4 bg-green-700 text-white hover:bg-green-600 float-right"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Gig
            </Button>
            <div className="tracking-tight text-3xl ">
              <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                Booked Gigs
              </span>
            </div>           
            <div className="overflow-x-auto clear-both">
              <Table className="w-full border-l border-r border-b border-[#4A5568] text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
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
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
        {isFormVisible && (
          <div className="bg-[#111C44]  rounded-lg  mx-auto">
            <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-mono mb-3">
            <span className="w-[100%]  text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
              {currentGig ? "Edit Gig" : "Add New Gig"}
        </span>
      </h1>
              <Button variant="ghost" onClick={handleCloseForm}>
                <X className="h-6 w-6" />
              </Button>
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
          </div>
        )}
      </div>
      
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
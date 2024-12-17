  "use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Trash2, Plus, Edit, X, Calendar, Clock, Edit2, Search, ChevronDown } from 'lucide-react'
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
import { format, getTime } from "date-fns"
import { dbHelpers, type Gig } from '@/utils/db-helpers'
import { time } from "node:console"

// Add this helper function to validate Date objects
const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
}

// Update the formatTimeOrDefault function with better error handling
const formatTimeOrDefault = (date: Date | null) => {
  try {
    if (!date || !isValidDate(date)) {
      console.warn('Invalid date provided to formatTimeOrDefault:', date);
      return format(new Date(), "h:mm a");
    }

    return format(date, "h:mm a");
  } catch (e) {
    console.error('Error formatting time:', e);
    return format(new Date(), "h:mm a");
  }
}

// Add validation to the time state setters
const safeSetTime = (newTime: Date, setter: React.Dispatch<React.SetStateAction<Date>>) => {
  try {
    if (!isValidDate(newTime)) {
      console.warn('Attempted to set invalid time:', newTime);
      setter(new Date());
      return;
    }
    setter(newTime);
  } catch (e) {
    console.error('Error setting time:', e);
    setter(new Date());
  }
}

// Update the time change handlers
const handleHourChange = (value: string, currentTime: Date, setter: React.Dispatch<React.SetStateAction<Date>>) => {
  try {
    const newTime = new Date(currentTime);
    let hours = parseInt(value);
    const isPM = newTime.getHours() >= 12;
    if (isPM) hours = hours + 12;
    newTime.setHours(hours);
    safeSetTime(newTime, setter);
  } catch (e) {
    console.error('Error updating hours:', e);
  }
}

const handleMinuteChange = (value: string, currentTime: Date, setter: React.Dispatch<React.SetStateAction<Date>>) => {
  try {
    const newTime = new Date(currentTime);
    newTime.setMinutes(parseInt(value));
    safeSetTime(newTime, setter);
  } catch (e) {
    console.error('Error updating minutes:', e);
  }
}

const handleAMPMToggle = (currentTime: Date, setter: React.Dispatch<React.SetStateAction<Date>>) => {
  try {
    const newTime = new Date(currentTime);
    const hours = newTime.getHours();
    newTime.setHours(hours >= 12 ? hours - 12 : hours + 12);
    safeSetTime(newTime, setter);
  } catch (e) {
    console.error('Error toggling AM/PM:', e);
  }
}

// Add this helper function at the top level
const formatDateSafely = (dateString: string | null | undefined) => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return format(date, "MMM dd, yyyy");
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export default function GigManagement() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [currentGig, setCurrentGig] = useState<Gig | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [formDate, setFormDate] = useState<Date>(new Date())
  const [loadInTime, setLoadInTime] = useState<Date>(new Date())
  const [setTime, setSetTime] = useState<Date>(new Date())
  

  useEffect(() => {
    const loadGigs = async () => {
      try {
        const savedGigs = await dbHelpers.getGigs();
        setGigs(savedGigs);
      } catch (error) {
        console.error('Error loading gigs:', error);
      }
    };
    loadGigs();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newGig = {
      id: currentGig?.id,
      title: formData.get("title") as string,
      venue: formData.get("venue") as string,
      venue_address: formData.get("venueAddress") as string,
      venue_city: formData.get("venueCity") as string,
      venue_state: formData.get("venueState") as string,
      venue_zip: formData.get("venueZip") as string,
      contact_name: formData.get("contactName") as string,
      contact_email: formData.get("contactEmail") as string,
      contact_phone: formData.get("contactPhone") as string,
      gig_date: format(formDate, "yyyy-MM-dd"),
      load_in_time: formatTimeOrDefault(loadInTime),
      set_time: formatTimeOrDefault(setTime),
      set_length: formData.get("setLength") as string,
      gig_details: formData.get("gigDetails") as string,
      meal_included: formData.get("mealIncluded") === "on",
      hotel_included: formData.get("hotelIncluded") === "on",
      deposit_amount: Number(formData.get("depositAmount")),
      deposit_paid: formData.get("depositPaid") === "on",
      total_payout: Number(formData.get("totalPayout")),
    }

    try {
      const savedGig = await dbHelpers.saveGig(newGig);
      if (currentGig) {
        setGigs(gigs.map(gig => gig.id === currentGig.id ? savedGig : gig))
      } else {
        setGigs([...gigs, savedGig])
      }
      setIsFormVisible(false)
      setCurrentGig(null)
    } catch (error) {
      console.error('Error saving gig:', error);
    }
  }

  const handleEdit = (gig: Gig) => {
    setCurrentGig(gig)
    setIsFormVisible(true)

    try {
      // Set form date
      if (gig.gig_date) {
        const date = new Date(gig.gig_date)
        if (isValidDate(date)) {
          setFormDate(date)
        } else {
          setFormDate(new Date())
        }
      }

      // Set load in time
      if (gig.load_in_time) {
        const loadInDate = new Date()
        try {
          const [time, period] = (gig.load_in_time || '').split(' ')
          if (time && period) {
            const [hours, minutes] = time.split(':').map(Number)
            if (!isNaN(hours) && !isNaN(minutes)) {
              loadInDate.setHours(
                period.toUpperCase() === 'PM' && hours !== 12 ? hours + 12 : hours,
                minutes
              )
              setLoadInTime(loadInDate)
            }
          }
        } catch (e) {
          console.error('Error parsing load in time:', e)
          setLoadInTime(new Date())
        }
      }

      // Set set time
      if (gig.set_time) {
        const setTimeDate = new Date()
        try {
          const [time, period] = (gig.set_time || '').split(' ')
          if (time && period) {
            const [hours, minutes] = time.split(':').map(Number)
            if (!isNaN(hours) && !isNaN(minutes)) {
              setTimeDate.setHours(
                period.toUpperCase() === 'PM' && hours !== 12 ? hours + 12 : hours,
                minutes
              )
              setSetTime(setTimeDate)
            }
          }
        } catch (e) {
          console.error('Error parsing set time:', e)
          setSetTime(new Date())
        }
      }
    } catch (error) {
      console.error('Error setting dates:', error)
      setFormDate(new Date())
      setLoadInTime(new Date())
      setSetTime(new Date())
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await dbHelpers.deleteGig(id)
      setGigs(gigs.filter(gig => gig.id !== id))
    } catch (error) {
      console.error('Error deleting gig:', error)
    }
  }

  const handleAddNew = () => {
    setCurrentGig(null)
    setIsFormVisible(true)
  }

  const handleCloseForm = () => {
    setIsFormVisible(false)
    setCurrentGig(null)
  }

  const formatTimeOrDefault = (date: Date | null) => {
    try {
      return date ? format(date, "h:mm a") : format(new Date(), "h:mm a")
    } catch (e) {
      console.error('Error formatting time:', e)
      return format(new Date(), "h:mm a")
    }
  }

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
                            onClick={() => handleDelete(gig.id)}
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
                          <Button variant="outline" className="bg-[#1B2559] hover:text-white focus:text-white hover:bg-black focus:bg-black border-grey-600 text-white flex-1">
                            <Calendar className="mr-2 h-4 w-4" />
                            {format(formDate || new Date(), "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-[#0f1729] border-[#4A5568] text-white">
                          <CalendarComponent
                            mode="single"
                            selected={formDate}
                            onSelect={(date: Date | undefined) => date && setFormDate(date)}
                            initialFocus
                            required={false}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>                
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="title">Gig Title</Label>
                    <Input id="title" name="title" defaultValue={currentGig?.title} required className="bg-[#1B2559]" />
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="venue">Venue</Label>
                    <Input id="venue" name="venue" defaultValue={currentGig?.venue} required className="bg-[#1B2559]" />
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="venueAddress">Venue Address</Label>
                    <Input id="venueAddress" name="venueAddress" defaultValue={currentGig?.venue_address} required className="bg-[#1B2559]" />
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="venueCity">Venue City</Label>
                    <Input id="venueCity" name="venueCity" defaultValue={currentGig?.venue_city} required className="bg-[#1B2559]" />
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="venueState">Venue State</Label>
                    <Input id="venueState" name="venueState" defaultValue={currentGig?.venue_state} required className="bg-[#1B2559]" />
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="venueZip">Venue Zip</Label>
                    <Input id="venueZip" name="venueZip" defaultValue={currentGig?.venue_zip} required className="bg-[#1B2559]" />
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input id="contactName" name="contactName" defaultValue={currentGig?.contact_name} required className="bg-[#1B2559]" />
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" name="contactEmail" type="email" defaultValue={currentGig?.contact_email} required className="bg-[#1B2559]" />
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input id="contactPhone" name="contactPhone" type="tel" defaultValue={currentGig?.contact_phone} required className="bg-[#1B2559]" />
                  </div>
                </div>
                <div className="w-full md:w-1/2 px-2">   
                <div className="mb-2">
                    <Label htmlFor="loadInTime">Load In Time</Label>
                    <div className="flex space-x-2">                    
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="bg-[#1B2559] hover:text-white focus:text-white hover:bg-black focus:bg-black border-grey-600 text-white flex-1">
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
                  <div className="mt-[17px]">
                    <div className="">
                      <Checkbox className="border-white border" id="crewHandsIn" name="depositPaid" defaultChecked={currentGig?.deposit_paid} />
                      <Label className="ml-2" htmlFor="crewHandsIn">Hands On In</Label>
                    </div>
                    <div className="mt-4">
                      <Checkbox className="border-white border" id="crewHandsOut" name="depositPaid" defaultChecked={currentGig?.deposit_paid} />
                      <Label className="ml-2"  htmlFor="crewHandsOut">Hands On Out</Label>
                    </div>                    
                  </div>                                                
                  <div className="mb-4 mt-4">
                    <Label htmlFor="setTime">Set Time</Label>
                      <div className="flex space-x-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="bg-[#1B2559] hover:text-white focus:text-white hover:bg-black focus:bg-black border-grey-600 text-white flex-1">
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
                  <div className="mb-4">
                    <Label htmlFor="setLength">Set Length (Hours)</Label>
                    <Input id="setLength" name="setLength" defaultValue={currentGig?.set_length} required className="bg-[#1B2559]" />
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="depositAmount">Deposit Amount (USD)</Label>
                    <Input className="bg-[#1B2559] ml-2" id="depositAmount" name="depositAmount" type="number" defaultValue={currentGig?.deposit_amount} required />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center space-x-2 ">
                      <Checkbox className="border-white border" id="depositPaid" name="depositPaid" defaultChecked={currentGig?.deposit_paid} />
                      <Label htmlFor="depositPaid">Deposit Paid</Label>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-4 mb-4">
                    <div className="flex iems-center space-x-2 mt-4">
                      <Checkbox className="border-white border" id="hotelIncluded" name="hotelIncluded" defaultChecked={currentGig?.hotel_included} />
                      <Label htmlFor="hotelIncluded">Hotel Included</Label>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      <Checkbox className="border-white border" id="mealIncluded" name="mealIncluded" defaultChecked={currentGig?.meal_included} />
                      <Label htmlFor="mealIncluded">Meal Included</Label>
                    </div>
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="totalPayout">Total Payout</Label>
                    <Input id="totalPayout" name="totalPayout" type="number" defaultValue={currentGig?.total_payout} required className="bg-[#1B2559]" />
                  </div>
                  <div className="mb-3">
                    <Label htmlFor="gigDetails">Gig Details</Label>
                    <Textarea 
                      id="gigDetails" 
                      name="gigDetails" 
                      defaultValue={currentGig?.gig_details} 
                      className="bg-[#1B2559] h-[200px] resize-none" 
                    />
                  </div>
                  <div className="flex space-x-4 justify-start mt-6">
                    <Button type="submit" className="bg-green-800 border border-black hover:bg-green-500 px-8">
                      {currentGig ? "Update Gig" : "Add Gig"}
                    </Button>
                    <Button type="button" onClick={handleCloseForm} className="bg-red-600 hover:bg-red-700 text-white px-8">
                      Cancel
                    </Button>
                  </div>
                </div>
                </div>
            </form>      
          </div>
        )}
      </div>
    </div>
      )
}
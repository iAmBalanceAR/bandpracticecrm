"use client"

import * as React from "react"
import { useState } from "react"
import { X, Calendar, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { useSupabase } from '@/components/providers/supabase-client-provider'
import { useToast } from '@/components/ui/use-toast'

interface Tour {
  id: number;
  title: string;
  description: string;
  thumbnail: string | null;
  departure_date: string | null;
  return_date: string | null;
  status: 'Building' | 'In Progress' | 'Closed';
  session_id: string;
  date_created: string;
  last_updated: string;
}

interface TourFormProps {
  tour?: Tour;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TourForm({ tour, onClose, onSuccess }: TourFormProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [departureDate, setDepartureDate] = useState<Date>(
    tour?.departure_date ? new Date(tour.departure_date) : new Date()
  )
  const [returnDate, setReturnDate] = useState<Date>(
    tour?.return_date ? new Date(tour.return_date) : new Date()
  )
  const [status, setStatus] = useState<Tour['status']>(tour?.status || 'Building')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const formData = new FormData(e.currentTarget)
      
      const tourData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        departure_date: format(departureDate, "yyyy-MM-dd"),
        return_date: format(returnDate, "yyyy-MM-dd"),
        status: status,
      }

      let result
      if (tour) {
        const { data, error } = await supabase
          .rpc('update_tour', { 
            tour_id: tour.id,
            tour_data: tourData
          })

        if (error) throw error
        result = data
      } else {
        const { data, error } = await supabase
          .rpc('create_tour', { tour_data: tourData })

        if (error) throw error
        result = data
      }

      toast({
        title: tour ? "Tour Updated" : "Tour Created",
        description: tour ? "Tour has been updated successfully" : "New tour has been created successfully",
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving tour:', error)
      toast({
        title: "Error",
        description: "Failed to save tour. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-[#111C44] rounded-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-mono mb-3">
                <span className="w-[100%] text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                  {tour ? "Edit Tour" : "Add New Tour"}
                </span>
              </h1>
              <Button variant="ghost" onClick={onClose}>
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
                    defaultValue={tour?.title}
                    required 
                    className="bg-[#1B2559]" 
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description"
                    defaultValue={tour?.description}
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
                    ) : tour ? (
                      "Update Tour"
                    ) : (
                      "Create Tour"
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={onClose} 
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
  )
} 
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useSupabase } from '@/components/providers/supabase-client-provider'
import { FeedbackModal } from '@/components/ui/feedback-modal'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Star, StarOff, Loader2, Edit2, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { useTour } from '@/components/providers/tour-provider'
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import CustomSectionHeader from '@/components/common/CustomSectionHeader'

interface Tour {
  id: string
  title: string
  start_date: string
  end_date: string
  description: string | null
  is_default: boolean
  created_at: string
  user_id: string
}

type FeedbackType = 'success' | 'error' | 'warning' | 'delete'

interface FeedbackModalState {
  isOpen: boolean
  title: string
  message: string
  type: FeedbackType
}

interface FormData {
  title: string
  startDate: Date
  endDate: Date
  description: string
  isDefault: boolean
}

export function TourDetails() {
  const { supabase } = useSupabase()
  const { currentTour, setCurrentTour } = useTour()
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [tours, setTours] = useState<Tour[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTourEdit, setCurrentTourEdit] = useState<Tour | null>(null)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    startDate: new Date(),
    endDate: new Date(),
    description: '',
    isDefault: false
  })
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  })

  useEffect(() => {
    fetchTours()
  }, [])

  const fetchTours = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTours(data || [])
    } catch (error: any) {
      console.error('Error fetching tours:', error)
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load tours',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (tour: Tour) => {
    setCurrentTourEdit(tour)
    setFormData({
      title: tour.title,
      startDate: tour.start_date ? new Date(tour.start_date.split('T')[0]) : new Date(),
      endDate: tour.end_date ? new Date(tour.end_date.split('T')[0]) : new Date(),
      description: tour.description || '',
      isDefault: tour.is_default
    })
    setIsFormVisible(true)
  }

  const handleCloseForm = () => {
    setIsFormVisible(false)
    setCurrentTourEdit(null)
    setFormData({
      title: '',
      startDate: new Date(),
      endDate: new Date(),
      description: '',
      isDefault: false
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const tourData = {
        title: formData.title,
        start_date: formData.startDate.toISOString(),
        end_date: formData.endDate.toISOString(),
        description: formData.description || null,
        user_id: user.id
      }

      let savedTourId: string

      if (currentTourEdit) {
        const { error } = await supabase
          .from('tours')
          .update(tourData)
          .eq('id', currentTourEdit.id)

        if (error) throw error
        savedTourId = currentTourEdit.id

        setFeedbackModal({
          isOpen: true,
          title: 'Success',
          message: 'Tour updated successfully',
          type: 'success'
        })
      } else {
        const { data, error } = await supabase
          .from('tours')
          .insert([tourData])
          .select()
          .single()

        if (error) throw error
        savedTourId = data.id

        setFeedbackModal({
          isOpen: true,
          title: 'Success',
          message: 'Tour created successfully',
          type: 'success'
        })
      }

      if (formData.isDefault) {
        const { error: defaultError } = await supabase
          .rpc('set_default_tour', { 
            p_tour_id: savedTourId
          })

        if (defaultError) throw defaultError
      }

      handleCloseForm()
      fetchTours()
      
      if (formData.isDefault) {
        const { data } = await supabase
          .from('tours')
          .select('*')
          .eq('id', savedTourId)
          .single()
        
        if (data) {
          setCurrentTour(data)
        }
      }
    } catch (error: any) {
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: error.message,
        type: 'error'
      })
    }
  }

  const handleSetDefault = async (tourId: string) => {
    try {
      // Call the set_default_tour function directly with the tourId
      const { error } = await supabase
        .rpc('set_default_tour', { 
          p_tour_id: tourId  // tourId should already be a UUID from the database
        })

      if (error) throw error

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: 'Default tour updated successfully',
        type: 'success'
      })

      fetchTours()
      const { data } = await supabase
        .from('tours')
        .select('*')
        .eq('id', tourId)
        .single()
      
      if (data) {
        setCurrentTour(data)
      }
    } catch (error: any) {
      console.error('Error setting default tour:', error)
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: error.message,
        type: 'error' as FeedbackType
      })
    }
  }

  return (
    <CustomSectionHeader title="Tour Details" underlineColor="#131d43">
      <Card className="bg-[#111C44] border-none">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            <div className="tracking-tight text-3xl">
              <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                Tour List
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex justify-between items-center mb-6">
              <Button
                onClick={() => setIsFormVisible(true)}
                className="bg-green-700 text-white hover:bg-green-600 float-right"
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Tour
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#008ffb]" />
              </div>
            ) : tours.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No tours found</p>
                <Button 
                  onClick={() => setIsFormVisible(true)}
                  className="bg-[#008ffb] hover:bg-[#0070cc]"
                >
                  Create your first tour
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full border-l border-r border-b border-[#4A5568] text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                  <TableHeader>
                    <TableRow className="bg-black hover:bg-[#1E293B] text-white text-shadow-lg -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                      <TableHead className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">Title</TableHead>
                      <TableHead className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">Start Date</TableHead>
                      <TableHead className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">End Date</TableHead>
                      <TableHead className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">Description</TableHead>
                      <TableHead className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">Default</TableHead>
                      <TableHead className="text-white border-t border-b border-[#4A5568] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tours.map((tour) => (
                      <TableRow key={tour.id} className="hover:bg-black border-b border-[#4A5568]">
                        <TableCell className="font-medium text-gray-200 py-2">
                          <div className="flex items-center">
                            <span>{tour.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-200 py-2 text-center">
                          {tour.start_date ? format(new Date(tour.start_date.split('T')[0]), 'PPP') : 'Not set'}
                        </TableCell>
                        <TableCell className="text-gray-200 py-2 text-center">
                          {tour.end_date ? format(new Date(tour.end_date.split('T')[0]), 'PPP') : 'Not set'}
                        </TableCell>
                        <TableCell className="text-gray-200 py-2">
                          {tour.description || '-'}
                        </TableCell>
                        <TableCell className="text-gray-200 py-2 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSetDefault(tour.id)}
                            className={tour.is_default ? 'text-yellow-400' : 'text-gray-400'}
                          >
                            {tour.is_default ? (
                              <Star className="h-5 w-5 fill-current" />
                            ) : (
                              <StarOff className="h-5 w-5" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex space-x-2 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(tour)}
                              className="hover:bg-[#2D3748] hover:text-lime-400 hover:shadow-green-400 hover:shadow-sm hover:font-semibold text-white"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(tour.id)}
                              className="hover:bg-[#2D3748] hover:text-lime-400 hover:shadow-green-400 hover:shadow-sm hover:font-semibold text-white"
                            >
                              Set Default
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <Dialog open={isFormVisible} onChange={(open) => !open && handleCloseForm()}>
            <DialogContent className="bg-[#131d43] text-white border-blue-800 p-8 rounded-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-white">
                  {currentTourEdit ? 'Edit Tour' : 'Add New Tour'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-[#1B2559] border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full bg-[#1B2559] border-gray-600 text-white justify-start"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(new Date(formData.startDate), 'PPP') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#1B2559] border-gray-600">
                        <CalendarComponent
                          mode="single"
                          selected={formData.startDate ? new Date(formData.startDate) : undefined}
                          onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full bg-[#1B2559] border-gray-600 text-white justify-start"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? format(new Date(formData.endDate), 'PPP') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#1B2559] border-gray-600">
                        <CalendarComponent
                          mode="single"
                          selected={formData.endDate ? new Date(formData.endDate) : undefined}
                          onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-[#1B2559] border-gray-600 text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="border-white"
                  />
                  <Label htmlFor="isDefault">Set as default tour</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseForm}
                    className="bg-red-700 text-white hover:bg-red-600 border-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-700 text-white hover:bg-green-600"
                  >
                    {currentTourEdit ? 'Update Tour' : 'Create Tour'}
                  </Button>
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
        </CardContent>
      </Card>
    </CustomSectionHeader>
  )
} 
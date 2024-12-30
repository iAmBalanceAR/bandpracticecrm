"use client"

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from "../ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, GripVertical, Calendar } from 'lucide-react'
import { gigHelpers } from '@/utils/db/gigs'
import { Label } from "@/components/ui/label"
import createClient from '@/utils/supabase/client'
import type { Venue } from '@/types/venue'
import { FeedbackModal } from "@/components/ui/feedback-modal"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import CustomSectionHeader from '@/components/common/CustomSectionHeader'

const MapWithNoSSR = dynamic(
  () => import('./map-component'),
  { 
    ssr: false,
    loading: () => <p>Loading map...</p>
  }
)

interface TourStop {
  id: string
  name: string
  lat: number
  lng: number
  city: string
  state: string
  address: string
  zip: string
  savedToGigs?: boolean
  gig_date?: string
}

interface RouteInfo {
  stops: TourStop[]
  distances: number[]
  totalMileage: number
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
  addresstype: string;
  country_code?: string;
  address?: {
    country_code?: string;
  }
}

interface SortableStopItemProps {
  stop: TourStop
  index: number
  distance?: number
  onAddToCalendar: (stop: TourStop) => void
  onDelete: (stop: TourStop) => void
}

function SortableStopItem({ stop, index, distance, onAddToCalendar, onDelete }: SortableStopItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-2 rounded ${
        stop.savedToGigs 
          ? "bg-gradient-to-r from-indigo-900 to-[#1B2559] border-l-4 border-[#008ffb]" 
          : "bg-gradient-to-r from-emerald-900 to-[#1B2559] border-l-4 border-emerald-500"
      }`}
    >
      <div className="flex-grow text-white">
        <div className="flex items-center gap-2">
          {!stop.savedToGigs && (
            <button
              className="cursor-grab touch-none p-1 hover:bg-black/30 rounded"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4 text-emerald-400" />
            </button>
          )}
          <span className={`font-semibold ${stop.savedToGigs ? 'text-[#008ffb]' : 'text-emerald-400'}`}>
            #{index + 1}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{stop.name}</span>
            {stop.savedToGigs && (
              <Calendar className="w-4 h-4 text-[#008ffb]" />
            )}
          </div>
        </div>
        <div className="text-sm text-gray-300 ml-8">
          {stop.city}, {stop.state}
        </div>
        <div className="flex items-center gap-2 ml-8 mt-2">
          {!stop.savedToGigs && (
            <>
              <Button
                onClick={() => onAddToCalendar(stop)}
                variant="ghost"
                size="sm"
                className="text-emerald-400 hover:text-emerald-300"
              >
                Add to Calendar
              </Button>
              <Button
                onClick={() => onDelete(stop)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
      {distance !== undefined && (
        <div className="text-sm text-gray-300">
          {distance.toFixed(1)} miles
        </div>
      )}
    </li>
  )
}

export default function TourManagement() {
  const [tourStops, setTourStops] = useState<TourStop[]>([])
  const [routeInfo, setRouteInfo] = useState<RouteInfo>({ stops: [], distances: [], totalMileage: 0 })
  const [route, setRoute] = useState<[number, number][]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zip: ''
  })
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'delete';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });
  const [pendingStop, setPendingStop] = useState<TourStop | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const loadGigData = async () => {
      try {
        // First, get all gigs and sort them by date
        const gigs = await gigHelpers.getGigs()
        const sortedGigs = gigs.sort((a, b) => 
          new Date(a.gig_date).getTime() - new Date(b.gig_date).getTime()
        )

        // Convert gigs to tour stops
        const gigStops = await Promise.all(sortedGigs.map(async (gig) => {
          // Get coordinates for the gig
          const coordinates = await getCoordinates(
            `${gig.venue_address}, ${gig.venue_city}, ${gig.venue_state} ${gig.venue_zip}`
          )

          return {
            id: gig.id,
            name: gig.venue,
            lat: coordinates[0],
            lng: coordinates[1],
            city: gig.venue_city,
            state: gig.venue_state,
            address: gig.venue_address,
            zip: gig.venue_zip,
            savedToGigs: true,
            gig_date: gig.gig_date
          }
        }))

        // Get saved stops from localStorage
        const savedStopsString = localStorage.getItem('tourStops')
        let unsavedStops: TourStop[] = []
        
        if (savedStopsString) {
          const parsedStops = JSON.parse(savedStopsString)
          // Get all unsaved stops
          unsavedStops = parsedStops.filter((stop: TourStop) => !stop.savedToGigs)
        }

        // Combine stops: saved gigs and unsaved stops
        const combinedStops = [...gigStops, ...unsavedStops]
        setTourStops(combinedStops)
        localStorage.setItem('tourStops', JSON.stringify(combinedStops))
      } catch (error) {
        console.error('Error loading gig data:', error)
        // If there's an error, load from localStorage
        const savedStopsString = localStorage.getItem('tourStops')
        if (savedStopsString) {
          setTourStops(JSON.parse(savedStopsString))
        }
      }
    }

    loadGigData()
  }, [])

  useEffect(() => {
    if (tourStops.length > 0) {
      localStorage.setItem('tourStops', JSON.stringify(tourStops))
    }
  }, [tourStops])

  useEffect(() => {
    if (tourStops.length > 1) {
      fetchRouteAndMileage(tourStops)
    }
  }, [tourStops])

  const fetchRouteAndMileage = useCallback(async (stops: TourStop[]) => {
    if (stops.length < 2) {
      setRouteInfo({ stops, distances: [], totalMileage: 0 })
      setRoute([])
      return
    }

    const waypoints = stops.map(stop => `${stop.lng},${stop.lat}`).join(';')
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full`)
    const data = await response.json()
    if (data.routes && data.routes[0]) {
      const decodedRoute = decodePolyline(data.routes[0].geometry)
      setRoute(decodedRoute)

      const legs = data.routes[0].legs
      const distances = legs.map((leg: { distance: number }) => leg.distance * 0.000621371) // Convert meters to miles
      const totalMileage = distances.reduce((sum: number, distance: number) => sum + distance, 0)
      setRouteInfo({ stops, distances, totalMileage })
    }
  }, [])

  const decodePolyline = (encoded: string): [number, number][] => {
    const poly: [number, number][] = []
    let index = 0, lat = 0, lng = 0

    while (index < encoded.length) {
      let b, shift = 0, result = 0
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1))
      lat += dlat

      shift = 0
      result = 0
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1))
      lng += dlng

      poly.push([lat / 1e5, lng / 1e5])
    }

    return poly
  }

  const handleVenueSearch = async (value: string) => {
    setSearchValue(value)
    if (value === '') {
      setVenues([])
      return
    }
    if (value.length > 2) {
      try {
        const supabase = createClient()
        console.log('Searching for venues with query:', value)
        const { data, error } = await supabase
          .from('venues')
          .select('id, title, address, city, state, zip')
          .ilike('title', `%${value}%`)
          .limit(5)
        
        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
        console.log('Found venues:', data)
        setVenues(data || [])
      } catch (error) {
        console.error('Error searching venues:', error)
        setVenues([])
      }
    } else {
      setVenues([])
    }
  }

  const handleVenueSelect = (venue: Venue) => {
    console.log('Selected venue:', venue)
    setSelectedVenue(venue)
    setSearchValue(venue.title)
    setFormData({
      address: venue.address && venue.address !== 'null' ? venue.address : '',
      city: venue.city && venue.city !== 'null' ? venue.city : '',
      state: venue.state && venue.state !== 'null' ? venue.state : '',
      zip: venue.zip && venue.zip !== 'null' ? venue.zip : ''
    })
    setVenues([])
  }

  const handleAddStop = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    console.log('Adding stop with form data:', formData)
    const { city, state } = formData
    if (!city || !state) {
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Please fill in at least the city and state fields',
        type: 'error'
      })
      return
    }

    const searchLocation = [
      formData.address && formData.address !== 'null' ? formData.address : '',
      city,
      state,
      formData.zip && formData.zip !== 'null' ? formData.zip : ''
    ]
      .filter(Boolean)
      .join(', ')

    const coordinates = await getCoordinates(searchLocation)
    console.log('Got coordinates:', coordinates)
    if (coordinates[0] === 0 && coordinates[1] === 0) {
      return
    }

    const newStop: TourStop = {
      id: Date.now().toString(),
      name: selectedVenue ? selectedVenue.title : `${city}, ${state}`,
      lat: coordinates[0],
      lng: coordinates[1],
      city,
      state,
      address: formData.address && formData.address !== 'null' ? formData.address : '',
      zip: formData.zip && formData.zip !== 'null' ? formData.zip : '',
      savedToGigs: false,
      gig_date: new Date().toISOString().split('T')[0] // Default to today's date
    }

    // Check for duplicates
    const isDuplicate = tourStops.some(stop => 
      stop.city.toLowerCase() === city.toLowerCase() &&
      stop.state.toLowerCase() === state.toLowerCase() &&
      (formData.address ? stop.address.toLowerCase() === formData.address.toLowerCase() : true)
    )

    if (isDuplicate) {
      setFeedbackModal({
        isOpen: true,
        title: 'Duplicate Venue Detected',
        message: 'This venue is already in your tour stops. Some artists play multiple shows at the same venue during a tour. Would you like to add it anyway?',
        type: 'delete',
        onConfirm: () => {
          addStopToTour(newStop)
        }
      })
      return
    }

    addStopToTour(newStop)
  }

  const addStopToTour = (stop: TourStop) => {
    setTourStops(prevStops => {
      // Get all saved and unsaved stops
      const savedStops = prevStops.filter(s => s.savedToGigs)
      const unsavedStops = prevStops.filter(s => !s.savedToGigs)
      
      // Add the new stop to unsaved stops
      unsavedStops.push(stop)
      
      // Combine them back together
      const newStops = [...savedStops, ...unsavedStops]
      return newStops
    })
    
    setSearchValue('')
    setSelectedVenue(null)
    setFormData({
      address: '',
      city: '',
      state: '',
      zip: ''
    })
    setPendingStop(null)
  }

  const handleAddToCalendar = async (stop: TourStop) => {
    try {
      const gigData = {
        title: stop.name,
        venue: stop.name,
        venue_address: stop.address,
        venue_city: stop.city,
        venue_state: stop.state,
        venue_zip: stop.zip,
        gig_date: new Date().toISOString().split('T')[0], // Default to today, will be changed in gig form
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        load_in_time: '18:00',
        sound_check_time: '18:30',
        set_time: '20:00',
        set_length: '45 minutes',
        crew_hands_in: false,
        crew_hands_out: false,
        meal_included: false,
        hotel_included: false,
        deposit_amount: 0,
        deposit_paid: false,
        contract_total: 0,
        open_balance: 0,
        gig_details: '', // Add the required field
        gig_status: 'pending' as const // Add the required field
      }

      await gigHelpers.createGig(gigData)
      
      setTourStops(prevStops => 
        prevStops.map(s => 
          s.id === stop.id ? { ...s, savedToGigs: true } : s
        )
      )

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: 'Successfully added to calendar!',
        type: 'success'
      })
    } catch (error) {
      console.error('Error adding to calendar:', error)
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to add to calendar. Please try again.',
        type: 'error'
      })
    }
  }

  const getCoordinates = async (location: string): Promise<[number, number]> => {
    try {
      const params = new URLSearchParams({
        format: 'json',
        q: location,
        addressdetails: '1',
        countrycodes: 'us',
        limit: '5'
      })

      const url = `https://nominatim.openstreetmap.org/search?${params}`
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BandPracticeTourManager/1.0'
        }
      })
      const data = await response.json()
      
      if (!data || data.length === 0) {
        setFeedbackModal({
          isOpen: true,
          title: 'Error',
          message: "Location not found. Please try adding more details.",
          type: 'error'
        })
        return [0, 0]
      }

      const validResult = data.find((result: NominatimResult) => 
        result.addresstype !== 'county' && 
        result.display_name.toLowerCase().includes('united states')
      )

      const result = validResult || data[0]
      return [parseFloat(result.lat), parseFloat(result.lon)]
    } catch (error) {
      console.error('Geocoding error:', error)
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: "There was a problem searching for this location.",
        type: 'error'
      })
      return [0, 0]
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setTourStops((stops) => {
      const oldIndex = stops.findIndex((stop) => stop.id === active.id)
      const newIndex = stops.findIndex((stop) => stop.id === over.id)
      
      // Only allow reordering if the dragged stop is not saved to gigs
      if (stops[oldIndex].savedToGigs) return stops

      // Get all saved stops with their indices
      const savedStops = stops
        .map((stop, index) => ({ stop, index }))
        .filter(item => item.stop.savedToGigs)

      // If we're moving between saved stops, check if it would create an out-of-order situation
      if (savedStops.length > 1) {
        for (let i = 0; i < savedStops.length - 1; i++) {
          const currentSaved = savedStops[i]
          const nextSaved = savedStops[i + 1]
          
          // If we're trying to place an unsaved stop between two saved stops
          if (newIndex > currentSaved.index && newIndex <= nextSaved.index) {
            // If the dragged stop doesn't have a date, prevent the move
            if (!stops[oldIndex].gig_date) {
              setFeedbackModal({
                isOpen: true,
                title: 'Invalid Move',
                message: 'Cannot move a stop without a scheduled date between dated stops.',
                type: 'error'
              })
              return stops
            }

            // Check if the dates would be out of order
            const draggedDate = new Date(stops[oldIndex].gig_date as string)
            const currentDate = new Date(currentSaved.stop.gig_date!)
            const nextDate = new Date(nextSaved.stop.gig_date!)
            
            if (draggedDate < currentDate || draggedDate > nextDate) {
              setFeedbackModal({
                isOpen: true,
                title: 'Invalid Move',
                message: 'Cannot place this stop here as it would create an out-of-order date sequence.',
                type: 'error'
              })
              return stops // Prevent the move if it would create an out-of-order situation
            }
          }
        }
      }

      return arrayMove(stops, oldIndex, newIndex)
    })
  }

  const handleDeleteStop = (stopToDelete: TourStop) => {
    setFeedbackModal({
      isOpen: true,
      title: 'Confirm Delete',
      message: 'Are you sure you want to remove this stop from your tour route?',
      type: 'delete',
      onConfirm: () => {
        setTourStops(prevStops => prevStops.filter(stop => stop.id !== stopToDelete.id))
        setFeedbackModal(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  return (
    <CustomSectionHeader title="Tour Route Management" underlineColor="#131d43">
      <Card className="bg-[#111C44] border-none">
        <CardHeader>
            <CardTitle className="text-3xl font-bold">
              <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                Tour Map
              </span>
            </CardTitle>
          </CardHeader>
        <CardContent>
            <div className="h-[400px] rounded-lg overflow-hidden -z-[99999]">
              <MapWithNoSSR 
                tourStops={tourStops}
                route={route}
                routeInfo={routeInfo}
              />
            </div>
          </CardContent>
        </Card>        
      <Card className="bg-[#111C44] border-none">
        <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl mb-6">
                  <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                    Search for Venues
                  </span>
                  <div className="border-[#ff9920] border-b-2 -mt-2 mb-4 w-[100%] h-2"></div>
                </h3>
                <div className="space-y-4">
                  <div>
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
                        <div className="absolute w-full z-50 mt-1 bg-[#1B2559] rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                          {venues.map((venue) => (
                            <div
                              key={venue.id}
                              onClick={() => handleVenueSelect(venue)}
                              className="cursor-pointer hover:bg-[#2a3c7d] p-2 flex justify-between items-center"
                            >
                              <span className="font-medium">{venue.title}</span>
                              <span className="text-sm text-gray-400">
                                {venue.city}, {venue.state}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="bg-[#1B2559]"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        className="bg-[#1B2559]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                        className="bg-[#1B2559]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        value={formData.zip}
                        onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                        className="bg-[#1B2559]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleAddStop} 
                      className="bg-green-800 hover:bg-green-700 text-white"
                      type="button"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Stop
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl mb-6">
                  <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                    Tour Route Plan
                  </span>
                  <div className="border-[#ff9920] border-b-2 -mt-2 mb-4 w-[100%] h-2"></div>
                </h3>
                <div className="mt-4">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={tourStops}
                      strategy={verticalListSortingStrategy}
                    >
                      <ul className="space-y-2">
                        {tourStops.map((stop, index) => (
                          <SortableStopItem
                            key={stop.id}
                            stop={stop}
                            index={index}
                            distance={index > 0 ? routeInfo.distances[index - 1] : undefined}
                            onAddToCalendar={handleAddToCalendar}
                            onDelete={handleDeleteStop}
                          />
                        ))}
                      </ul>
                    </SortableContext>
                  </DndContext>
                </div>
                {routeInfo.totalMileage > 0 && (
                  <div className="mt-4 text-right text-lg font-semibold text-white">
                    Total Mileage: <span className="text-[#008ffb]">{routeInfo.totalMileage.toFixed(1)} miles</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        onConfirm={() => {
          if (feedbackModal.onConfirm) {
            feedbackModal.onConfirm()
          }
          setFeedbackModal(prev => ({ ...prev, isOpen: false }))
        }}
      />
    </CustomSectionHeader>
  )
}
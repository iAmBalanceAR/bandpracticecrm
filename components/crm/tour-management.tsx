"use client"

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from "../ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, GripVertical, Calendar, Loader2, FileDown } from 'lucide-react'
import { gigHelpers } from '@/utils/db/gigs'
import { Label } from "@/components/ui/label"
import { useSupabase } from '@/components/providers/supabase-client-provider'
import { useAuth } from '@/components/providers/auth-provider'
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
  savingStop: string | null
}

function SortableStopItem({ stop, index, distance, onAddToCalendar, onDelete, savingStop }: SortableStopItemProps) {
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

  // Format the date
  const formattedDate = stop.gig_date 
    ? new Date(stop.gig_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    : null

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
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#008ffb]" />
                {formattedDate && (
                  <span className="text-sm text-[#008ffb] font-medium">
                    {formattedDate}
                  </span>
                )}
              </div>
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
                disabled={savingStop === stop.id}
              >
                {savingStop === stop.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Add to Calendar
              </Button>
              <Button
                onClick={() => onDelete(stop)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
                disabled={savingStop === stop.id}
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

const calculateDateBetween = (date1: Date, date2: Date): string => {
  const timestamp1 = date1.getTime()
  const timestamp2 = date2.getTime()
  const middleTimestamp = timestamp1 + ((timestamp2 - timestamp1) / 2)
  return new Date(middleTimestamp).toISOString().split('T')[0]
}

const areDatesTooClose = (date1: Date, date2: Date): boolean => {
  const oneDayInMs = 24 * 60 * 60 * 1000
  const diffInDays = Math.abs(date2.getTime() - date1.getTime()) / oneDayInMs
  return diffInDays <= 1 // Returns true if dates are 1 day or less apart
}

export default function TourManagement() {
  const { supabase } = useSupabase();
  const { isAuthenticated, loading: authLoading } = useAuth();
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
    type: 'success' | 'error' | 'delete' | 'warning';
    onConfirm?: () => void;
    confirmLabel?: string;
    confirmStyle?: 'success' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });
  const [pendingStop, setPendingStop] = useState<TourStop | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingStop, setSavingStop] = useState<string | null>(null)
  const [calculatingRoute, setCalculatingRoute] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (isAuthenticated) {
      loadGigData();
    }
  }, [isAuthenticated]);

  const loadGigData = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      // First, get all gigs
      const gigs = await gigHelpers.getGigs()
      
      // Filter out past gigs
      const currentDate = new Date()
      currentDate.setHours(0, 0, 0, 0)
      
      const filteredGigs = gigs.filter(gig => {
        if (!gig.gig_date) return false
        const gigDate = new Date(gig.gig_date + 'T00:00:00')
        return gigDate.getTime() >= currentDate.getTime()
      })

      // Sort filtered gigs by date
      const sortedGigs = filteredGigs.sort((a, b) => 
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
    } finally {
      setLoading(false)
    }
  }

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
    try {
      // Update the search value immediately
      setSearchValue(value)

      // Only query if we have at least 2 characters
      if (value.length < 2) {
        setVenues([])
        return
      }

      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .textSearch('title', value)
        .limit(5);

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error searching venues:', error);
      setVenues([]);
    }
  };

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
      gig_date: undefined 
    }

    // Show info modal about dates
    setFeedbackModal({
      isOpen: true,
      title: 'Tour Stop Added',
      message: 'Tour stop has been added to your route. Dates will be assigned when you add the stop to your calendar, where you can then adjust them as needed.',
      type: 'success'
    })

    addStopToTour(newStop)
  }

  const addStopToTour = (stop: TourStop) => {
    setTourStops(prevStops => {
      // Get all stops
      const allStops = [...prevStops, stop]
      
      // Sort all stops by date
      const sortedStops = allStops.sort((a, b) => {
        const dateA = new Date(a.gig_date || '').getTime()
        const dateB = new Date(b.gig_date || '').getTime()
        return dateA - dateB
      })
      
      return sortedStops
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
    if (!stop) return
    setSavingStop(stop.id)

    try {
      // Calculate suggested date based on position
      const suggestedDate = calculateSuggestedDate(stop, tourStops)

      // Check if the suggested date would create a tight schedule
      const stopIndex = tourStops.findIndex(s => s.id === stop.id)
      const savedStops = tourStops
        .filter(s => s.savedToGigs && s.gig_date)
        .sort((a, b) => new Date(a.gig_date!).getTime() - new Date(b.gig_date!).getTime())

      const prevSavedStop = savedStops.findLast(s => tourStops.findIndex(as => as.id === s.id) < stopIndex)
      const nextSavedStop = savedStops.find(s => tourStops.findIndex(as => as.id === s.id) > stopIndex)

      if ((prevSavedStop && areDatesTooClose(new Date(prevSavedStop.gig_date!), new Date(suggestedDate))) ||
          (nextSavedStop && areDatesTooClose(new Date(suggestedDate), new Date(nextSavedStop.gig_date!)))) {
        
        setFeedbackModal({
          isOpen: true,
          title: 'Warning: Tight Schedule',
          message: 'This stop would be added between events that are only 1 day apart. Would you like to proceed?',
          type: 'warning',
          onConfirm: () => {
            // Proceed with adding to calendar
            addToCalendarWithDate(stop, suggestedDate)
          }
        })
        setSavingStop(null)
        return
      }

      // If dates aren't too close, proceed normally
      await addToCalendarWithDate(stop, suggestedDate)

    } catch (error) {
      console.error('Error saving gig:', error)
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to add stop to calendar',
        type: 'error'
      })
      setSavingStop(null)
    }
  }

  // Helper function to handle the actual calendar addition
  const addToCalendarWithDate = async (stop: TourStop, date: string) => {
    try {
      const gigData = {
        title: stop.name,
        venue: stop.name,
        venue_address: stop.address,
        venue_city: stop.city,
        venue_state: stop.state,
        venue_zip: stop.zip,
        gig_date: date,
        load_in_time: '18:00:00',
        sound_check_time: '19:00:00',
        set_time: '20:00:00',
        set_length: '45',
        gig_details: 'Added from tour route',
        crew_hands_in: false,
        crew_hands_out: false,
        meal_included: false,
        hotel_included: false,
        deposit_amount: 0,
        deposit_paid: false,
        contract_total: 0,
        open_balance: 0,
        contact_name: 'TBD',
        contact_email: '',
        contact_phone: '',
        gig_status: 'pending'
      } as const;

      const newGig = await gigHelpers.createGig(gigData);

      // Rest of the existing calendar addition logic...
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: defaultTour } = await supabase
        .from('tours')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (defaultTour) {
        const { error: connectError } = await supabase
          .from('tourconnect')
          .insert([{
            gig_id: newGig.id,
            tour_id: defaultTour.id,
            user_id: user.id
          }]);

        if (connectError) {
          console.error('Error connecting gig to default tour:', connectError);
        }
      }

      // Update the stop in tourStops
      const updatedStops = tourStops.map(s => 
        s.id === stop.id 
          ? { ...s, savedToGigs: true, gig_date: date }
          : s
      );

      setTourStops(updatedStops);
      localStorage.setItem('tourStops', JSON.stringify(updatedStops));

      setFeedbackModal({
        isOpen: true,
        title: 'Stop Added to Calendar',
        message: 'The stop has been added to your calendar with a suggested date based on its position. You can adjust the date in the calendar view if needed.',
        type: 'success'
      })
    } finally {
      setSavingStop(null)
    }
  }

  // Helper function to calculate suggested date based on position
  const calculateSuggestedDate = (stop: TourStop, allStops: TourStop[]): string => {
    const savedStops = allStops
      .filter(s => s.savedToGigs && s.gig_date)
      .sort((a, b) => new Date(a.gig_date!).getTime() - new Date(b.gig_date!).getTime())

    if (savedStops.length === 0) {
      return new Date().toISOString().split('T')[0]
    }

    const stopIndex = allStops.findIndex(s => s.id === stop.id)
    const prevSavedStop = savedStops.findLast(s => allStops.findIndex(as => as.id === s.id) < stopIndex)
    const nextSavedStop = savedStops.find(s => allStops.findIndex(as => as.id === s.id) > stopIndex)

    if (prevSavedStop && nextSavedStop) {
      return calculateDateBetween(new Date(prevSavedStop.gig_date!), new Date(nextSavedStop.gig_date!))
    } else if (prevSavedStop) {
      const suggestedDate = new Date(prevSavedStop.gig_date!)
      suggestedDate.setDate(suggestedDate.getDate() + 1)
      return suggestedDate.toISOString().split('T')[0]
    } else if (nextSavedStop) {
      const suggestedDate = new Date(nextSavedStop.gig_date!)
      suggestedDate.setDate(suggestedDate.getDate() - 1)
      return suggestedDate.toISOString().split('T')[0]
    }

    return new Date().toISOString().split('T')[0]
  }

  const getCoordinates = async (location: string): Promise<[number, number]> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          location
        )}`
      );
      const data: NominatimResult[] = await response.json();

      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      throw new Error('Location not found');
    } catch (error) {
      console.error('Error getting coordinates:', error);
      throw error;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setTourStops((stops) => {
      const oldIndex = stops.findIndex((stop) => stop.id === active.id)
      const newIndex = stops.findIndex((stop) => stop.id === over.id)
      
      // Allow free movement of unsaved stops
      const movingStop = stops[oldIndex]
      if (!movingStop.savedToGigs) {
        return arrayMove(stops, oldIndex, newIndex)
      }

      // Only enforce order for saved stops
      const savedStops = stops
        .map((stop, index) => ({ stop, index }))
        .filter(item => item.stop.savedToGigs)

      // If moving a saved stop, ensure it stays in chronological order
      if (savedStops.length > 1) {
        const movingStopIndex = savedStops.findIndex(s => s.stop.id === movingStop.id)
        if (movingStopIndex > -1) {
          // Prevent moving saved stops out of chronological order
          if (
            (movingStopIndex > 0 && newIndex < savedStops[movingStopIndex - 1].index) ||
            (movingStopIndex < savedStops.length - 1 && newIndex > savedStops[movingStopIndex + 1].index)
          ) {
            setFeedbackModal({
              isOpen: true,
              title: 'Cannot Reorder',
              message: 'Saved stops must remain in chronological order. Please adjust the date in the calendar to reorder.',
              type: 'error'
            })
            return stops
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
          <p className="mb-4">Please sign in to view tour route.</p>
        </div>
      </Card>
    );
  }

  return (
    <>
    <Card className="bg-[#111C44]  border-none p-0 m-0 mb-6">
    <CardHeader className="pb-0 mb-0">
      <CardTitle className="flex justify-between items-center text-3xl font-bold">
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
            <div className="h-[400px] border-[#ff9920] border-2 rounded-lg overflow-hidden -z-[99999]">
              <MapWithNoSSR 
                tourStops={tourStops}
                route={route}
                routeInfo={routeInfo}
              />
            </div>
          </CardContent>
        </Card>        
      <Card className="bg-[#111C44] border-none">
        <CardContent className="p-0">
            <div className="space-y-4">
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
                    Tour Stopss
                  </span>
                  <div className="border-[#ff9920] border-b-2 -mt-2 mb-4 w-[100%] h-2"></div>
                </h3>
                <div className="mt-4">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[200px] bg-[#111C44]/50 rounded-lg">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                      <p className="text-muted-foreground">Loading tour stops...</p>
                    </div>
                  ) : (
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
                              savingStop={savingStop}
                            />
                          ))}
                        </ul>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
                {routeInfo.totalMileage > 0 && (
                  <div className="mt-4 text-right">
                    <div className="text-lg font-semibold text-white mb-2">
                      Total Mileage: <span className="text-[#008ffb]">{routeInfo.totalMileage.toFixed(1)} miles</span>
                    </div>
                    <Button
                      onClick={() => window.location.href = '/tour-route/exports'}
                      className="bg-[#008ffb] hover:bg-[#0070cc] text-white"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export Tour Data
                    </Button>
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
      {calculatingRoute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#131d43] p-8 rounded-lg shadow-xl flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-white">Calculating optimal route...</p>
          </div>
        </div>
      )}
    </>
  )
}
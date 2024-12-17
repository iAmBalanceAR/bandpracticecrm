"use client"

import React, { useState, useEffect, useCallback } from 'react'
import L, { map } from 'leaflet'
import dynamic from 'next/dynamic'
import { Button } from "../ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { CustomDialog } from "@/components/ui/custom-dialog"

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

export default function TourManagement() {
  const [tourStops, setTourStops] = useState<TourStop[]>([])
  const [newStopName, setNewStopName] = useState('')
  const [routeInfo, setRouteInfo] = useState<RouteInfo>({ stops: [], distances: [], totalMileage: 0 })
  const [route, setRoute] = useState<[number, number][]>([])
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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

  useEffect(() => {
    fetchRouteAndMileage(tourStops)
  }, [fetchRouteAndMileage, tourStops])

  const addTourStop = async () => {
    if (newStopName) {
      const coordinates = await getCoordinates(newStopName)
      if (coordinates[0] === 0 && coordinates[1] === 0) {
        return // Early return on error
      }
      
      // Validate coordinates before creating stop
      if (!isNaN(coordinates[0]) && !isNaN(coordinates[1])) {
        const newStop: TourStop = {
          id: Date.now().toString(),
          name: newStopName,
          lat: coordinates[0],
          lng: coordinates[1]
        }
        setTourStops(prevStops => [...prevStops, newStop])
        setNewStopName('')
      } else {
        setErrorMessage("Invalid coordinates received from geocoding service")
        setErrorModalOpen(true)
      }
    }
  }

  const removeTourStop = (id: string) => {
    setTourStops(prevStops => prevStops.filter(stop => stop.id !== id))
  }

  const getCoordinates = async (location: string): Promise<[number, number]> => {
    try {
      // Check if input is just a ZIP code (5 digits)
      const isZipCode = /^\d{5}$/.test(location.trim())
      
      // Build different parameters for ZIP vs regular search
      const params = new URLSearchParams(
        isZipCode 
          ? {
              format: 'json',
              postalcode: location.trim(),
              countrycodes: 'us',
              addressdetails: '1',
              limit: '1'
            }
          : {
              format: 'json',
              q: location,
              addressdetails: '1',
              countrycodes: 'us',
              limit: '5'
            }
      )

      const url = `https://nominatim.openstreetmap.org/search?${params}`
      
      console.log('Request URL:', url)
      console.log('Searching for:', location)

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BandPracticeTourManager/1.0'
        }
      })
      const data = await response.json()
      
      console.log('All Results:', data)
      
      if (!data || data.length === 0) {
        setErrorMessage("Location not found. Please try adding more details.")
        setErrorModalOpen(true)
        return [0, 0]
      }

      // For ZIP codes, just take the first US result
      if (isZipCode) {
        const usResult = data.find((result: NominatimResult) => 
          result.display_name.toLowerCase().includes('united states')
        )
        if (!usResult) {
          setErrorMessage("ZIP code not found in the United States.")
          setErrorModalOpen(true)
          return [0, 0]
        }
        return [parseFloat(usResult.lat), parseFloat(usResult.lon)]
      }

      // For other searches, continue with existing logic
      const validResult = data.find((result: NominatimResult) => 
        result.addresstype !== 'county' && 
        result.display_name.toLowerCase().includes('united states')
      )

      console.log('Selected Result:', validResult || data[0])

      const result = validResult || data[0]
      return [parseFloat(result.lat), parseFloat(result.lon)]
    } catch (error) {
      console.error('Geocoding error:', error)
      setErrorMessage("There was a problem searching for this location.")
      setErrorModalOpen(true)
      return [0, 0]
    }
  }

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

  return (
    <div className="pl-4 pt-3 bg-[#0f1729] text-white min-h-screen">
      <h1 className="text-4xl font-mono mb-4">
        <span className="w-[100%]  text-white text-shadow-smfont-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          Tour Management
        </span>
      </h1>
      <div className="border-[#ff9920] border-b-2 -mt-8 mb-4 w-[100%] h-4"></div>
      
      <div className="bg-[#131d43] text-white  shadow-sm shadow-green-400 rounded-md border-blue-800 border">
      <Card className="bg-[#111C44] border-none">
          <CardHeader>
          <CardTitle className="text-3xl font-bold "><span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">Tour Map</span>
          
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
          <CardHeader>
            <CardTitle className="text-3xl font-bold m-0 p-0">
              <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                Tour Stops
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex mb-4">
              <Input
                type="text"
                placeholder="Enter tour stop name"
                value={newStopName}
                onChange={(e) => setNewStopName(e.target.value)}      
                className='bg-[#1B2559]'          
              />
              <Button onClick={addTourStop} className="bg-green-800 border-black border text-white hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" /> Add Stop
              </Button>
            </div>
            <ul className="space-y-2">
              {tourStops.map((stop, index) => (
                <li
                  key={stop.id}
                  className="flex items-center justify-between bg-[#1B2559] p-2 rounded"
                >
                  <div className="mr-2">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="flex-grow text-white text-shadow-lg shadow-green-200">
                    <span>{index + 1}. {stop.name}</span>
                    {index > 0 && routeInfo.distances[index - 1] && (
                      <span className="ml-2 text-sm text-red-400">
                        ({routeInfo.distances[index - 1].toFixed(1)} miles from previous)
                      </span>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => removeTourStop(stop.id)} 
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
            {routeInfo.totalMileage > 0 && (
              <div className="mt-4 text-right text-lg font-semibold text-white text-shadow-lg shadow-green-200">
                Total Mileage: {routeInfo.totalMileage.toFixed(1)} miles
              </div>
            )}
          </CardContent>
        </Card>       
      </div>
      <CustomDialog
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Something Went Wrong..."
      >
        <div className="py-4 text-gray-200 whitespace-pre-line">
          {errorMessage}
        </div>
      </CustomDialog>
    </div>
    )
  }
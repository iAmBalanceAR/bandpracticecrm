"use client"

import React, { useEffect, useState, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { gigHelpers } from '@/utils/db/gigs'
import { format } from 'date-fns'

// Custom styles to override Leaflet's z-index
const mapStyles = `
  .leaflet-pane {
    z-index: 1 !important;
  }
  .leaflet-top,
  .leaflet-bottom {
    z-index: 2 !important;
  }
`

// Fixing the icon image paths
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
})

interface TourStop {
  id: string
  name: string
  city: string
  state: string
  date: string
  lat: number
  lng: number
}

function MapWrapper() {
  const [map, setMap] = useState<L.Map | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [route, setRoute] = useState<[number, number][]>([])
  const [tourStops, setTourStops] = useState<TourStop[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Add custom styles to document head
    const styleElement = document.createElement('style')
    styleElement.textContent = mapStyles
    document.head.appendChild(styleElement)

    // Load gig data
    const loadGigData = async () => {
      const { tourStops } = await gigHelpers.getGigsWithCoordinates()
      setTourStops(tourStops)
    }

    loadGigData()

    if (containerRef.current && !mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([39.8283, -98.5795], 4)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current)

      setMap(mapRef.current)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      // Remove custom styles
      styleElement.remove()
    }
  }, [])

  // Update markers and route when tour stops change
  useEffect(() => {
    if (!mapRef.current || tourStops.length === 0) return

    // Clear existing markers and route
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        layer.remove()
      }
    })

    // Add markers for each stop
    tourStops.forEach((stop, index) => {
      L.marker([stop.lat, stop.lng])
        .bindPopup(`
          <div class="text-sm">
            <p class="font-bold">Stop #${index + 1}</p>
            <p class="font-semibold">${stop.name}</p>
            <p>${stop.city}, ${stop.state}</p>
            <p class="text-xs mt-1">${format(new Date(stop.date), 'MMM d, yyyy')}</p>
          </div>
        `)
        .addTo(mapRef.current!)
    })

    // Fetch and draw route
    if (tourStops.length > 1) {
      fetchSequentialRoute(tourStops)
        .then(routeData => {
          if (mapRef.current && routeData.length > 0) {
            L.polyline(routeData, {
              color: '#008ffb',
              weight: 3,
              opacity: 0.7
            }).addTo(mapRef.current)
          }
        })
        .catch(error => console.error('Error fetching route:', error))
    }

    // Fit bounds to show all markers
    const bounds = L.latLngBounds(tourStops.map(stop => [stop.lat, stop.lng]))
    mapRef.current.fitBounds(bounds, { padding: [50, 50] })
  }, [tourStops])

  return <div ref={containerRef} className="w-auto h-[400px]" />
}

async function fetchSequentialRoute(stops: TourStop[]): Promise<[number, number][]> {
  let fullRoute: [number, number][] = []

  for (let i = 0; i < stops.length - 1; i++) {
    const start = stops[i]
    const end = stops[i + 1]
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
    
    try {
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.code !== 'Ok') {
        console.error(`Failed to fetch route between ${start.name} and ${end.name}`)
        continue
      }
      
      const routeSegment = data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number])
      fullRoute = fullRoute.concat(routeSegment)
    } catch (error) {
      console.error(`Error fetching route segment: ${error}`)
      continue
    }
  }

  return fullRoute
}

interface TourMapProps {
  mode?: 'simple' | 'full'
}

export default function TourMap({ mode = 'simple' }: TourMapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) {
    return null
  }

  // Simple mode just shows the map
  if (mode === 'simple') {
    return <MapWrapper />
  }

  // Full mode includes header and entry area
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tour Route Management</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <MapWrapper />
        </div>
        
        <div className="space-y-4">
          <div className="bg-[#1B2559] p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2 text-white">Current Tour Stops</h3>
            <div className="space-y-2">
              {/* Tour stops will be populated dynamically */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
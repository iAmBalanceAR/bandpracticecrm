"use client"

import React, { useEffect, useState, useRef } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Fixing the icon image paths
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
})

interface TourLocation {
  id: number
  name: string
  position: [number, number]
}

const tourLocations: TourLocation[] = [
  { id: 1, name: "Little Rock, AR", position: [34.7465, -92.2896] },
  { id: 2, name: "Dallas, TX", position: [32.7767, -96.7970] },
  { id: 3, name: "Oklahoma City, OK", position: [35.4676, -97.5164] },
  { id: 4, name: "St. Louis, MO", position: [38.6270, -90.1994] },
  { id: 5, name: "Atlanta, GA", position: [33.7490, -84.3880] },
  { id: 6, name: "Memphis, TN", position: [35.1495, -90.0490] },
  { id: 7, name: "Little Rock, AR", position: [34.7465, -92.2896] },
]

function MapWrapper() {
  const [map, setMap] = useState<L.Map | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [route, setRoute] = useState<[number, number][]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([39.8283, -98.5795], 4)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current)

      // Add markers
      tourLocations.forEach(location => {
        L.marker(location.position)
          .bindPopup(`<h3>${location.name}</h3><p>Stop #${location.id}</p>`)
          .addTo(mapRef.current!)
      })

      setMap(mapRef.current)

      // Fetch and draw route
      fetchSequentialRoute(tourLocations)
        .then(routeData => {
          if (mapRef.current && routeData.length > 0) {
            L.polyline(routeData, {
              color: 'blue',
              weight: 3,
              opacity: 0.7
            }).addTo(mapRef.current)
          }
        })
        .catch(error => console.error('Error fetching route:', error))
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return <div ref={containerRef} className="w-auto h-[400px]" />
}

async function fetchSequentialRoute(locations: TourLocation[]): Promise<[number, number][]> {
  let fullRoute: [number, number][] = []

  for (let i = 0; i < locations.length - 1; i++) {
    const start = locations[i]
    const end = locations[i + 1]
    const url = `https://router.project-osrm.org/route/v1/driving/${start.position[1]},${start.position[0]};${end.position[1]},${end.position[0]}?overview=full&geometries=geojson`
    
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
        {/* Add any additional header content here */}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <MapWrapper />
        </div>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Current Tour Stops</h3>
            <ul className="space-y-2">
              {tourLocations.map((location) => (
                <li key={location.id} className="flex justify-between items-center">
                  <span>{location.name}</span>
                  <span className="text-sm text-gray-500">Stop #{location.id}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
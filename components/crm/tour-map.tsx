"use client"

import React, { useEffect, useState, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { gigHelpers, type TourStop } from '@/utils/db/gigs'
import { format } from 'date-fns'
import { useTour } from '@/components/providers/tour-provider'

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
    if (map && tourStops.length > 0) {
      // Clear existing markers and route
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          layer.remove()
        }
      })

      // Add markers for each tour stop
      const coordinates: [number, number][] = []
      tourStops.forEach((stop) => {
        const { lat, lng } = stop
        coordinates.push([lat, lng])

        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-pin"></div>`,
          })
        })

        marker.addTo(map)
          .bindPopup(`
            <div class="text-sm">
              <div class="font-semibold">${stop.name}</div>
              <div>${stop.city}, ${stop.state}</div>
              <div>${format(new Date(stop.gig_date), 'MMM d, yyyy')}</div>
            </div>
          `)
      })

      // Draw route between stops
      if (coordinates.length > 1) {
        const routeLine = L.polyline(coordinates, {
          color: '#008ffb',
          weight: 3,
          opacity: 0.7
        }).addTo(map)

        // Fit map bounds to include all markers
        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] })
      } else if (coordinates.length === 1) {
        map.setView(coordinates[0], 8)
      }

      setRoute(coordinates)
    }
  }, [map, tourStops])

  return (
    <div className="relative h-[400px] bg-[#0f1729] rounded-lg border border-[#008ffb]">
      <div ref={containerRef} className="h-full" />
    </div>
  )
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

export default function TourMap() {
  return (
    <div className="h-full">
      <MapWrapper />
    </div>
  )
}
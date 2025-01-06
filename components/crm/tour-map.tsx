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

interface MapWrapperProps {
  isPdfExport?: boolean;
  mode?: 'simple' | 'detailed';
}

function MapWrapper({ isPdfExport = false }: MapWrapperProps) {
  const [map, setMap] = useState<L.Map | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [route, setRoute] = useState<[number, number][]>([])
  const [tourStops, setTourStops] = useState<TourStop[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentTour } = useTour()

  useEffect(() => {
    // Add custom styles to document head
    const styleElement = document.createElement('style')
    styleElement.textContent = mapStyles
    document.head.appendChild(styleElement)

    // Load gig data
    const loadGigData = async () => {
      if (currentTour?.id) {
        const { tourStops } = await gigHelpers.getGigsWithCoordinates(currentTour.id)
        setTourStops(tourStops)
      }
    }

    loadGigData()

    if (containerRef.current && !mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        // Add smooth zoom animation by default
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true
      }).setView([39.8283, -98.5795], isPdfExport ? 5 : 4, {
        animate: true,
        duration: 1
      })
      
      // Use a more detailed tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20
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
  }, [currentTour?.id])

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
      tourStops.forEach((stop, index) => {
        const { lat, lng } = stop
        coordinates.push([lat, lng])

        const marker = L.marker([lat, lng])
          .addTo(map)
          .bindPopup(`
            <div class="text-sm">
              <div class="font-semibold">${index + 1}. ${stop.name}</div>
              <div>${stop.city}, ${stop.state}</div>
              <div>${format(new Date(stop.gig_date), 'MMM d, yyyy')}</div>
            </div>
          `)
      })

      // Draw route between stops using OSRM
      if (coordinates.length > 1) {
        fetchSequentialRoute(tourStops).then(routeCoords => {
          const routeLine = L.polyline(routeCoords, {
            color: '#008ffb',
            weight: 5,
            opacity: 0.9
          }).addTo(map)

          // Calculate the bounds with margin
          const bounds = routeLine.getBounds()
          const latMargin = (bounds.getNorth() - bounds.getSouth()) * 0.15
          const lngMargin = (bounds.getEast() - bounds.getWest()) * 0.15
          
          const expandedBounds = L.latLngBounds(
            [bounds.getSouth() - latMargin, bounds.getWest() - lngMargin],
            [bounds.getNorth() + latMargin, bounds.getEast() + lngMargin]
          )
          
          map.fitBounds(expandedBounds, { 
            padding: [5, 5],
            maxZoom: 12,
            animate: true,
            duration: 2.5, // Slower animation (2.5 seconds)
            easeLinearity: 0.2  // More gradual easing
          })

          // Add distance markers at midpoint
          const midpoint = routeCoords[Math.floor(routeCoords.length / 2)]
          if (midpoint) {
            // Calculate total distance from the route data
            let totalDistance = 0
            for (let i = 0; i < tourStops.length - 1; i++) {
              const start = tourStops[i]
              const end = tourStops[i + 1]
              const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=false`
              fetch(url)
                .then(response => response.json())
                .then(data => {
                  if (data.code === 'Ok') {
                    totalDistance += data.routes[0].distance * 0.000621371 // Convert meters to miles
                    // L.marker([midpoint[0], midpoint[1]], {
                    //   icon: L.divIcon({
                    //     className: 'distance-marker',
                    //     html: `<div class="bg-blue-600 text-white  px-2 py-1 rounded text-sm w-10">${Math.ceil(totalDistance)} mi</div>`,
                    //   })
                    // }).addTo(map)
                  }
                })
            }
          }
        }).catch(error => {
          console.error('Error fetching route:', error)
          // Fallback to straight lines if routing fails
          const routeLine = L.polyline(coordinates, {
            color: '#008ffb',
            weight: 4,
            opacity: 0.8,
            dashArray: '5, 10'
          }).addTo(map)
          map.fitBounds(routeLine.getBounds(), { 
            padding: [25, 25],
            maxZoom: 12
          })
        })
      } else if (coordinates.length === 1) {
        map.setView(coordinates[0], 13, {
          animate: true,
          duration: 1.5, // 1.5 seconds for smooth transition
          easeLinearity: 0.5
        })
      }

      setRoute(coordinates)
    }
  }, [map, tourStops])

  return (
    <div className={`relative ${isPdfExport ? 'h-[600px]' : 'h-[400px]'} bg-[#0f1729] rounded-lg border border-[#008ffb]`}>
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

export default function TourMap({ isPdfExport = false }: MapWrapperProps) {
  return (
    <div className="h-full">
      <MapWrapper isPdfExport={isPdfExport} />
    </div>
  )
}
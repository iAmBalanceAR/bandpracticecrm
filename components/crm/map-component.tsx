"use client"

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { AutoZoom } from './auto-zoom'

// Fix Leaflet icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface TourStop {
  id: string
  name: string
  lat: number
  lng: number
  gig_date?: string
}

interface RouteInfo {
  stops: TourStop[]
  distances: number[]
  totalMileage: number
}

interface MapComponentProps {
  tourStops: TourStop[]
  route: [number, number][]
  routeInfo: RouteInfo
  showFutureOnly?: boolean
}

const MapComponent = ({ tourStops, route, routeInfo, showFutureOnly = false }: MapComponentProps) => {
  // Filter out past dates if showFutureOnly is true
  const filteredStops = showFutureOnly
    ? tourStops.filter(stop => {
        if (!stop.gig_date) return false;
        const gigDate = new Date(stop.gig_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return gigDate >= today;
      })
    : tourStops;

  // Validate tour stops before rendering
  const validTourStops = filteredStops.filter(stop => 
    stop && 
    !isNaN(stop.lat) && 
    !isNaN(stop.lng) &&
    stop.lat !== 0 && 
    stop.lng !== 0
  )

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer 
        center={[39.8283, -98.5795]} 
        zoom={4} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {validTourStops.map((stop, index) => (
          <Marker 
            key={stop.id} 
            position={[stop.lat, stop.lng]}
          >
            <Popup>
              {index + 1}. {stop.name}
              {index > 0 && routeInfo.distances[index - 1] && (
                <div>
                  Distance from previous: {routeInfo.distances[index - 1].toFixed(1)} miles
                </div>
              )}
            </Popup>
          </Marker>
        ))}
        {route.length > 0 && (
          <Polyline 
            positions={route} 
            color="blue" 
          />
        )}
        <AutoZoom tourStops={validTourStops} />
      </MapContainer>
    </div>
  )
}

export default MapComponent 
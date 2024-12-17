"use client"

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export function MapInit() {
  // Fix the icon image paths
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/marker-icon-2x.png',
    iconUrl: '/images/marker-icon.png',
    shadowUrl: '/images/marker-shadow.png',
  })
  
  return null
} 
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

interface TourStop {
  id: string
  name: string
  lat: number
  lng: number
}

export function AutoZoom({ tourStops }: { tourStops: TourStop[] }) {
  const map = useMap()

  useEffect(() => {
    if (tourStops.length > 0) {
      const bounds = new L.LatLngBounds(tourStops.map(stop => [stop.lat, stop.lng]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [tourStops, map])

  return null
}
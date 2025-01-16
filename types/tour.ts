export interface TourStop {
  id: string
  name: string | null
  latitude: string
  longitude: string
  address?: string
  city?: string
  state?: string
  zip?: string
  savedToGigs?: boolean
  gig_date?: string
}

export interface RouteInfo {
  stops: TourStop[]
  distances: number[]
  totalMileage: number
} 
'use client'

import { TourProvider } from '@/components/providers/tour-provider'
import { TourDetails } from './tour-details'

export function TourDetailsWrapper() {
  return (
    <TourProvider>
      <TourDetails />
    </TourProvider>
  )
} 
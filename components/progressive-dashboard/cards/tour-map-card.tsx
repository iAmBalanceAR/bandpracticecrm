"use client"

import React from 'react'
import { ProgressiveCard } from '../utils/progressive-card'
import { useData } from '../utils/data-provider'
import { Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import the TourMap component to avoid SSR issues with Leaflet
const TourMap = dynamic(() => import('@/components/crm/tour-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-800 animate-pulse rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  )
})

export const TourMapCard: React.FC = () => {
  const { venues, isLoading } = useData()
  const router = useRouter()
  
  const isEmpty = venues.length === 0 && !isLoading
  
  const emptyStateContent = (
    <div className="text-center p-4">
      <Map className="h-12 w-12 text-red-500/50 mx-auto mb-2" />
      <h3 className="text-lg font-medium">No venues added yet</h3>
      <p className="text-sm text-gray-400">Add venue information to see them on the map</p>
    </div>
  )
  
  return (
    <ProgressiveCard
      title="Tour Route Map"
      icon={<Map className="h-5 w-5" />}
      color="[#ff9920]"
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyState={emptyStateContent}
      actionButton={
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs border-orange-500/30 text-orange-400 hover:bg-orange-950/30"
          onClick={() => router.push('/tour-route')}
        >
          View Full Map
        </Button>
      }
    >
      <div className="w-full h-[400px] relative rounded-md overflow-hidden">
        {!isEmpty && (
          <TourMap mode="simple" showFutureOnly={true} />
        )}
      </div>
    </ProgressiveCard>
  )
} 
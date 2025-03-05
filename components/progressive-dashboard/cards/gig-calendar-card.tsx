"use client"

import React from 'react'
import { ProgressiveCard } from '../utils/progressive-card'
import { useData } from '../utils/data-provider'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import the VerticalCalendar component
const VerticalCalendar = dynamic(() => import('@/components/crm/vertical-calendar'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[300px]">
      <div className="animate-pulse flex flex-col items-center">
        <CalendarDays className="h-8 w-8 text-blue-500/50 mb-2" />
        <div className="h-4 w-32 bg-gray-700 rounded"></div>
      </div>
    </div>
  )
})

export const GigCalendarCard: React.FC = () => {
  const { gigs, isLoading } = useData()
  const router = useRouter()
  
  const isEmpty = gigs.length === 0 && !isLoading
  
  const emptyStateContent = (
    <div className="text-center p-4">
      <CalendarDays className="h-12 w-12 text-blue-500/50 mx-auto mb-2" />
      <h3 className="text-lg font-medium">No gigs scheduled</h3>
      <p className="text-sm text-gray-400">Add gigs to see them in your calendar</p>
    </div>
  )
  
  return (
    <ProgressiveCard
      title="Upcoming Gigs"
      icon={<CalendarDays className="h-5 w-5" />}
      color="[#0088FE]"
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyState={emptyStateContent}
      className="h-full min-h-[400px]"
      actionButton={
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs border-blue-500/30 text-blue-400 hover:bg-blue-950/30"
          onClick={() => router.push('/calendar')}
        >
          View Full Calendar
        </Button>
      }
    >
      <div className="h-[calc(100%-2rem)] overflow-hidden">
        {!isEmpty && (
          <div className="h-full">
            <VerticalCalendar />
          </div>
        )}
      </div>
    </ProgressiveCard>
  )
} 
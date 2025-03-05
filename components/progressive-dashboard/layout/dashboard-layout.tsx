"use client"

import React, { useEffect, useState } from 'react'
import { useData } from '../utils/data-provider'
import { Loader2 } from 'lucide-react'
import { OnboardingCard } from '../cards/onboarding-card'
import { UserProfileCard } from '../cards/user-profile-card'
import { TourMapCard } from '../cards/tour-map-card'
import { GigCalendarCard } from '../cards/gig-calendar-card'
import { VenueListCard } from '../cards/venue-list-card'
import { LeadsCard } from '../cards/leads-card'
import { SetListsCard } from '../cards/set-lists-card'
import { RidersCard } from '../cards/riders-card'
import { StagePlotsCard } from '../cards/stage-plots-card'
import { AnalyticsCard } from '../cards/analytics-card'

type LayoutType = 'beginner' | 'intermediate' | 'advanced'

export const DashboardLayout: React.FC = () => {
  const { isLoading, hasData } = useData()
  const [layout, setLayout] = useState<LayoutType>('beginner')

  // Determine layout based on available data
  useEffect(() => {
    if (isLoading) return

    // Count how many data types are available
    const dataCount = Object.values(hasData).filter(Boolean).length

    if (dataCount <= 2) {
      setLayout('beginner')
    } else if (dataCount <= 5) {
      setLayout('intermediate')
    } else {
      setLayout('advanced')
    }
  }, [isLoading, hasData])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      {/* Beginner Layout */}
      {layout === 'beginner' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <OnboardingCard />
          </div>
          
          <div className="h-full">
            <UserProfileCard />
          </div>
          
          {hasData.gigs && (
            <div className="h-full">
              <GigCalendarCard />
            </div>
          )}
          
          {hasData.venues && (
            <div className="md:col-span-2">
              <VenueListCard />
            </div>
          )}
        </div>
      )}

      {/* Intermediate Layout */}
      {layout === 'intermediate' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-full">
            {hasData.venues ? <TourMapCard /> : <OnboardingCard />}
          </div>
          
          <div className="h-full">
            <UserProfileCard />
          </div>
          
          <div className="h-full">
            <GigCalendarCard />
          </div>
          
          <div className="h-full">
            <AnalyticsCard />
          </div>
          
          <div className="h-full">
            <VenueListCard />
          </div>
          
          {hasData.leads && (
            <div className="h-full">
              <LeadsCard />
            </div>
          )}
        </div>
      )}

      {/* Advanced Layout */}
      {layout === 'advanced' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-full">
            <TourMapCard />
          </div>
          
          <div className="h-full">
            <UserProfileCard />
          </div>
          
          <div className="h-full">
            <GigCalendarCard />
          </div>
          
          <div className="h-full">
            <AnalyticsCard />
          </div>
          
          <div className="h-full">
            <VenueListCard />
          </div>
          
          <div className="h-full">
            <LeadsCard />
          </div>
          
          {hasData.setLists && (
            <div className="h-full">
              <SetListsCard />
            </div>
          )}
          
          {hasData.riders && (
            <div className="h-full">
              <RidersCard />
            </div>
          )}
          
          {hasData.stagePlots && (
            <div className="h-full">
              <StagePlotsCard />
            </div>
          )}
        </div>
      )}
    </div>
  )
} 
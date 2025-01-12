"use client"

import React, { useState } from 'react'
import TourMapCard from "@/components/crm/tour-map-card"
import GigCalendarCard from "@/components/crm/gig-calendar-card"
import SavedVenuesCard from "@/components/crm/savedVenues"
import ContactsLeadsCard from "@/components/crm/contacts-leads-card"
import AnalyticsCard from "@/components/crm/analytics-card"
import StagePlotCard from "@/components/crm/stage-plot-card"
import { CustomDialog } from "@/components/ui/custom-dialog"
import { useTour } from "@/components/providers/tour-provider" 

export function Dashboard() {
  const { currentTour, isLoading } = useTour()
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  return (
    <>
      <div className="w-full">
        {/* Start Common Header Component  */} 
        <header className="flex items-center justify-between ml-8 pr-0 h-16">
          <h1 className="text-4xl text-white">
            <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
              {isLoading ? 'Loading...' : currentTour?.title || 'No Tour Selected'} : Dashboard
            </span>
          </h1>
        </header>
        <div className="clear-both border-[#d83b34] border-b-2 -mt-6 mb-0 ml-8 mr-8 h-4">&nbsp;</div>
        {/* End Common Header Component  */}
        <main className="clearboth p-4">
          <div className="w-full bg-[#0f1729] p-4">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <TourMapCard />
              </div>
              <div className="lg:col-span-1">
                <GigCalendarCard />
              </div>
            </div>  

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <SavedVenuesCard />
              <ContactsLeadsCard />
            </div>
            <div className="max-w-full mx-auto mt-6">
              <StagePlotCard />
            </div>
            <div className="max-w-full mx-auto mt-6">
              <AnalyticsCard  />
            </div>
          </div>
        </main>
        <CustomDialog
          isOpen={!!errorMessage}
          onClose={() => setErrorMessage('')}
          title="Something Went Wrong..."
        >
          <div className="py-4 text-gray-200 whitespace-pre-line">
            {errorMessage}
          </div>
        </CustomDialog>
      </div>        
    </>
  )
}

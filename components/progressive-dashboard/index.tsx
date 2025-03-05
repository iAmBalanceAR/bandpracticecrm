"use client"

import { useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-client-provider'
import { useTour } from '@/components/providers/tour-provider'
import { DashboardLayout } from './layout/dashboard-layout'
import { DataProvider } from './utils/data-provider'
import { CustomDialog } from "@/components/ui/custom-dialog"

export default function ProgressiveDashboard() {
  const { currentTour, isLoading: tourLoading } = useTour()
  const { user } = useSupabase()
  const [errorMessage, setErrorMessage] = useState('')
  
  return (
    <DataProvider>
      <div className="w-full">
        {/* Start Common Header Component  */} 
        <header className="flex items-center justify-between ml-4 pr-0 h-16">
          <h1 className="text-5xl text-white">
            <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800 ">
              {tourLoading ? 'Loading...' : currentTour?.title || 'No Tour Selected'} : Progressive Dashboard
            </span>
          </h1>
        </header>
        <div className="clear-both border-[#018FFB] border-b-2 -mt-5 mb-0 ml-4 mr-4 h-4">&nbsp;</div>
        {/* End Common Header Component  */}
        
        <main className="clearboth p-2">
          <DashboardLayout />
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
    </DataProvider>
  )
} 
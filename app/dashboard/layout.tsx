"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-client-provider'
import { useTour } from '@/components/providers/tour-provider'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading: authLoading } = useSupabase()
  const { currentTour, isLoading: tourLoading } = useTour()
  const router = useRouter()
  
  // Check if user is authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/dashboard')
    }
  }, [user, authLoading, router])
  
  // Check if a tour is selected
  React.useEffect(() => {
    if (!tourLoading && !currentTour && user) {
      router.push('/tours?redirect=/dashboard')
    }
  }, [currentTour, tourLoading, user, router])
  
  // Show loading state while checking authentication and tour
  if (authLoading || tourLoading || !user || !currentTour) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f1729]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white">Loading Dashboard...</h2>
          <p className="text-gray-400 mt-2">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[#0f1729]">
      {children}
    </div>
  )
} 
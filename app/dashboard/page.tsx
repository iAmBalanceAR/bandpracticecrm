'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/components/providers/supabase-client-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import TourMapCard from "@/components/crm/tour-map-card"
import GigCalendarCard from "@/components/crm/gig-calendar-card"
import SavedVenuesCard from "@/components/crm/savedVenues"
import ContactsLeadsCard from "@/components/crm/contacts-leads-card"
import AnalyticsCard from "@/components/crm/analytics-card"
import StagePlotCard from "@/components/crm/stage-plot-card"
import { CustomDialog } from "@/components/ui/custom-dialog"
import { useTour } from "@/components/providers/tour-provider"

export default function Dashboard() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, user } = useAuth()
  const { supabase } = useSupabase()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isAuthenticated, authLoading, router])

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-400 mb-4">Please sign in to view your dashboard</p>
        <Button asChild>
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TourMapCard />
            <GigCalendarCard />
            <SavedVenuesCard />
            <ContactsLeadsCard />
            <AnalyticsCard />
            <StagePlotCard />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-400">Email</dt>
                  <dd className="mt-1 text-sm text-white">{user?.email}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-400">Profile Status</dt>
                  <dd className="mt-1 text-sm text-white">
                    Active
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
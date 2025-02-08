'use client'

import React, { useState, useEffect } from 'react'
import createClient from '@/utils/supabase/client'
import { Card } from '@/components/ui/card'
import { BarChart3, MapPin, Guitar, Users, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface UserStats {
  toursCreated: number
  stagePlotsGenerated: number
  venueContactsSaved: number
  totalLeads: number
  gigsPlayed: number
}

export default function UserStatsPage() {
  const [stats, setStats] = useState<UserStats>({
    toursCreated: 0,
    stagePlotsGenerated: 0,
    venueContactsSaved: 0,
    totalLeads: 0,
    gigsPlayed: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function fetchStats() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        console.log('User:', { id: user.id, email: user.email }) // Debug user info

        // Fetch tours count
        const { count: toursCount } = await supabase
          .from('tours')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Fetch stage plots count
        const { count: stagePlotsCount } = await supabase
          .from('stage_plots')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Fetch saved venues count
        const { count: venuesCount } = await supabase
          .from('saved_venues')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Fetch leads count - using get_leads RPC
        const { data: leadsData, error: leadsError } = await supabase
          .rpc('get_leads')
        
        const leadsCount = leadsData?.length || 0

        // Debug leads query
        console.log('Leads Query:', {
          count: leadsCount,
          error: leadsError
        })

        // Fetch completed gigs count
        const { count: gigsCount } = await supabase
          .from('gigs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .lt('gig_date', new Date().toISOString()) // Only count past gigs

        setStats({
          toursCreated: toursCount || 0,
          stagePlotsGenerated: stagePlotsCount || 0,
          venueContactsSaved: venuesCount || 0,
          totalLeads: leadsCount || 0,
          gigsPlayed: gigsCount || 0
        })
      }
      setLoading(false)
    }

    fetchStats()
  }, [])

  return (
    <div className="pl-4 pt-3 bg-[#0f1729] text-white pb-4">
      <h1 className="text-4xl font-mono mb-4">
        <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          Usage Statistics
        </span>
      </h1>
      <div className="border-[#ff9920] border-b-2 -mt-8 mb-4 w-[98.55%] h-4"></div>
      
      <div className="pr-6 pl-8 pb-4 pt-4 bg-[#131d43] text-white shadow-sm shadow-green-400 rounded-md border-blue-800 border mr-4 ">
        <Card className="border-0">
          <div className="space-y-6">
            {/* Tours Created */}
            <div className="flex justify-between items-center p-4 bg-[#111c44] rounded-lg border border-blue-800">
              <div className="flex items-center space-x-4">
                <BarChart3 className="h-8 w-8 text-[#00e396]" />
                <div>
                  <h3 className="text-lg font-medium text-white">Tours Created</h3>
                  <p className="text-2xl font-bold text-[#00e396]">
                    {loading ? '...' : stats.toursCreated}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                onClick={() => router.push('/tours')}
              >
                View Tours
              </Button>
            </div>

            {/* Stage Plots */}
            <div className="flex justify-between items-center p-4 bg-[#111c44] rounded-lg border border-blue-800">
              <div className="flex items-center space-x-4">
                <Guitar className="h-8 w-8 text-[#ff9920]" />
                <div>
                  <h3 className="text-lg font-medium text-white">Stage Plots Generated</h3>
                  <p className="text-2xl font-bold text-[#ff9920]">
                    {loading ? '...' : stats.stagePlotsGenerated}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                onClick={() => router.push('/stage-plots')}
              >
                View Stage Plots
              </Button>
            </div>

            {/* Venue Contacts */}
            <div className="flex justify-between items-center p-4 bg-[#111c44] rounded-lg border border-blue-800">
              <div className="flex items-center space-x-4">
                <MapPin className="h-8 w-8 text-[#008ffb]" />
                <div>
                  <h3 className="text-lg font-medium text-white">Venue Contacts Saved</h3>
                  <p className="text-2xl font-bold text-[#008ffb]">
                    {loading ? '...' : stats.venueContactsSaved}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                onClick={() => router.push('/venues')}
              >
                View Venues
              </Button>
            </div>

            {/* Total Leads */}
            <div className="flex justify-between items-center p-4 bg-[#111c44] rounded-lg border border-blue-800">
              <div className="flex items-center space-x-4">
                <Users className="h-8 w-8 text-[#d83b34]" />
                <div>
                  <h3 className="text-lg font-medium text-white">Total Leads</h3>
                  <p className="text-2xl font-bold text-[#d83b34]">
                    {loading ? '...' : stats.totalLeads}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                onClick={() => router.push('/leads')}
              >
                View Leads
              </Button>
            </div>

            {/* Gigs Played */}
            <div className="flex justify-between items-center p-4 bg-[#111c44] rounded-lg border border-blue-800">
              <div className="flex items-center space-x-4">
                <Calendar className="h-8 w-8 text-[#43A7C5]" />
                <div>
                  <h3 className="text-lg font-medium text-white">Gigs Played</h3>
                  <p className="text-2xl font-bold text-[#43A7C5]">
                    {loading ? '...' : stats.gigsPlayed}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                onClick={() => router.push('/gigs')}
              >
                View Gigs
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 
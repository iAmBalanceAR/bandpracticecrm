"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSupabase } from '@/components/providers/supabase-client-provider'
import { useTour } from '@/components/providers/tour-provider'
import { useAuth } from '@/components/providers/auth-provider'

// Define the shape of our dashboard data
interface DashboardData {
  gigs: any[]
  venues: any[]
  leads: any[]
  reminders: any[]
  setLists: any[]
  riders: any[]
  stagePlots: any[]
  isLoading: boolean
  hasData: {
    gigs: boolean
    venues: boolean
    leads: boolean
    reminders: boolean
    setLists: boolean
    riders: boolean
    stagePlots: boolean
  }
  refreshData: () => Promise<void>
}

// Create the context
const DataContext = createContext<DashboardData | undefined>(undefined)

// Custom hook to use the data context
export const useData = () => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase } = useSupabase()
  const { currentTour } = useTour()
  const { user, isAuthenticated } = useAuth()
  
  const [isLoading, setIsLoading] = useState(true)
  const [gigs, setGigs] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])
  const [setLists, setSetLists] = useState<any[]>([])
  const [riders, setRiders] = useState<any[]>([])
  const [stagePlots, setStagePlots] = useState<any[]>([])
  
  // Sample data for demonstration purposes
  const sampleData = {
    gigs: [
      {
        id: 'sample-gig-1',
        title: 'Summer Festival',
        venue: 'Central Park',
        venue_address: '123 Park Ave',
        venue_city: 'New York',
        venue_state: 'NY',
        venue_zip: '10001',
        gig_date: new Date().toISOString(),
        load_in_time: '16:00:00',
        sound_check_time: '17:00:00',
        set_time: '20:00:00',
        contract_total: 2500,
        deposit_amount: 500,
        deposit_paid: true,
        open_balance: 2000,
        crew_hands_in: true,
        meal_included: true,
        hotel_included: false,
        contact_name: 'John Smith',
        contact_phone: '555-123-4567',
        contact_email: 'john@example.com',
        gig_details: 'Outdoor festival, bring weather protection for gear.'
      },
      {
        id: 'sample-gig-2',
        title: 'Wedding Reception',
        venue: 'Grand Hotel',
        venue_address: '456 Main St',
        venue_city: 'Boston',
        venue_state: 'MA',
        venue_zip: '02108',
        gig_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        load_in_time: '17:00:00',
        sound_check_time: '18:00:00',
        set_time: '19:30:00',
        contract_total: 1800,
        deposit_amount: 900,
        deposit_paid: true,
        open_balance: 900,
        crew_hands_in: false,
        meal_included: true,
        hotel_included: true,
        contact_name: 'Sarah Johnson',
        contact_phone: '555-987-6543',
        contact_email: 'sarah@example.com',
        gig_details: 'Formal attire required. First dance song: "At Last".'
      }
    ],
    venues: [
      {
        id: 'sample-venue-1',
        name: 'Central Park',
        address: '123 Park Ave',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        phone: '555-123-4567',
        email: 'events@centralpark.com',
        website: 'https://centralpark.com',
        type: 'Outdoor',
        capacity: 5000,
        notes: 'Large outdoor venue with excellent sound system. Weather dependent.'
      },
      {
        id: 'sample-venue-2',
        name: 'Grand Hotel',
        address: '456 Main St',
        city: 'Boston',
        state: 'MA',
        zip: '02108',
        phone: '555-987-6543',
        email: 'events@grandhotel.com',
        website: 'https://grandhotel.com',
        type: 'Hotel',
        capacity: 300,
        notes: 'Elegant ballroom with built-in sound system. Good for formal events.'
      }
    ],
    leads: [
      {
        id: 'sample-lead-1',
        name: 'Michael Brown',
        company: 'City Music Festival',
        email: 'michael@citymusicfest.com',
        phone: '555-111-2222',
        status: 'Contacted',
        type: 'Festival',
        notes: 'Interested in booking for next summer. Budget range $3000-5000.',
        followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'sample-lead-2',
        name: 'Jennifer White',
        company: 'Corporate Events Inc',
        email: 'jennifer@corpevents.com',
        phone: '555-333-4444',
        status: 'Negotiating',
        type: 'Corporate',
        notes: 'Looking for a band for annual company party. Needs 2-hour set.',
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    reminders: [
      {
        id: 'sample-reminder-1',
        title: 'Call sound engineer',
        description: 'Discuss equipment needs for upcoming festival',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        priority: 'high'
      },
      {
        id: 'sample-reminder-2',
        title: 'Submit stage plot',
        description: 'Send updated stage plot to venue manager',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        priority: 'medium'
      }
    ],
    setLists: [
      {
        id: 'sample-setlist-1',
        name: 'Standard 90-Minute Set',
        description: 'Our go-to setlist for most venues',
        songs: [
          { id: 1, title: 'Opening Number', duration: '4:30', key: 'G', notes: 'High energy opener' },
          { id: 2, title: 'Crowd Favorite', duration: '3:45', key: 'C', notes: 'Extended solo in middle' },
          { id: 3, title: 'Slow Ballad', duration: '5:15', key: 'D minor', notes: 'Acoustic arrangement' }
        ],
        duration: '90 minutes',
        lastUsed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    riders: [
      {
        id: 'sample-rider-1',
        name: 'Standard Technical Rider',
        description: 'Our technical requirements for most venues',
        sections: [
          { title: 'Sound System', content: 'Professional PA system capable of 110dB SPL at FOH' },
          { title: 'Lighting', content: 'Basic stage lighting with at least 2 front spots' },
          { title: 'Backline', content: 'Drum kit, bass amp, two guitar amps, keyboard stand' }
        ],
        lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    stagePlots: [
      {
        id: 'sample-stageplot-1',
        name: 'Standard 5-Piece Setup',
        description: 'Our standard stage setup for a 5-piece band',
        size: '24ft x 16ft',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-stageplot-2',
        name: 'Acoustic Trio Setup',
        description: 'Minimal setup for acoustic performances',
        size: '16ft x 12ft',
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
  
  // Function to fetch data from Supabase
  const fetchData = async () => {
    setIsLoading(true)
    
    try {
      // Check if user is authenticated and tour is selected
      if (!isAuthenticated || !user || !currentTour) {
        // Use sample data for demonstration
        setGigs(sampleData.gigs)
        setVenues(sampleData.venues)
        setLeads(sampleData.leads)
        setReminders(sampleData.reminders)
        setSetLists(sampleData.setLists)
        setRiders(sampleData.riders)
        setStagePlots(sampleData.stagePlots)
        setIsLoading(false)
        return
      }
      
      // Fetch gigs
      const { data: gigsData, error: gigsError } = await supabase
        .from('gigs')
        .select('*')
        .eq('tour_id', currentTour.id)
        .order('gig_date', { ascending: true })
      
      if (gigsError) throw gigsError
      setGigs(gigsData || [])
      
      // Fetch venues
      const { data: venuesData, error: venuesError } = await supabase
        .from('venues')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
      
      if (venuesError) throw venuesError
      setVenues(venuesData || [])
      
      // Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .rpc('get_leads')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (leadsError) throw leadsError
      setLeads(leadsData || [])
      
      // Fetch reminders
      const { data: remindersData, error: remindersError } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('due_date', { ascending: true })
      
      if (remindersError) throw remindersError
      setReminders(remindersData || [])
      
      // Fetch set lists
      const { data: setListsData, error: setListsError } = await supabase
        .from('set_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (setListsError) throw setListsError
      setSetLists(setListsData || [])
      
      // Fetch riders
      const { data: ridersData, error: ridersError } = await supabase
        .from('riders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (ridersError) throw ridersError
      setRiders(ridersData || [])
      
      // Fetch stage plots
      const { data: stagePlotsData, error: stagePlotsError } = await supabase
        .from('stage_plots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (stagePlotsError) throw stagePlotsError
      setStagePlots(stagePlotsData || [])
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      
      // Use sample data as fallback
      if (gigs.length === 0) setGigs(sampleData.gigs)
      if (venues.length === 0) setVenues(sampleData.venues)
      if (leads.length === 0) setLeads(sampleData.leads)
      if (reminders.length === 0) setReminders(sampleData.reminders)
      if (setLists.length === 0) setSetLists(sampleData.setLists)
      if (riders.length === 0) setRiders(sampleData.riders)
      if (stagePlots.length === 0) setStagePlots(sampleData.stagePlots)
      
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch data when auth state, user, or current tour changes
  useEffect(() => {
    fetchData()
  }, [isAuthenticated, user, currentTour])
  
  // Calculate if we have data for each section
  const hasData = {
    gigs: gigs.length > 0,
    venues: venues.length > 0,
    leads: leads.length > 0,
    reminders: reminders.length > 0,
    setLists: setLists.length > 0,
    riders: riders.length > 0,
    stagePlots: stagePlots.length > 0
  }
  
  return (
    <DataContext.Provider value={{
      gigs,
      venues,
      leads,
      reminders,
      setLists,
      riders,
      stagePlots,
      isLoading,
      hasData,
      refreshData: fetchData
    }}>
      {children}
    </DataContext.Provider>
  )
} 
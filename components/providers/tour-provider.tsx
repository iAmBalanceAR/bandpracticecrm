'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import createClient from '@/utils/supabase/client'

interface TourInfo {
  id: string
  title: string
  description: string | null
  departure_date: string | null
  return_date: string | null
  is_default: boolean
  user_id: string
  created_at: string
  updated_at: string
}

interface TourContextType {
  currentTour: TourInfo | null
  setCurrentTour: (tour: TourInfo | null) => void
  isLoading: boolean
  error: string | null
  refreshTour: () => Promise<void>
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [currentTour, setCurrentTour] = useState<TourInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const refreshTour = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No default tour found, try to get any tour
          const { data: anyTour, error: anyTourError } = await supabase
            .from('tours')
            .select('*')
            .eq('user_id', user.id)
            .limit(1)
            .single()

          if (!anyTourError && anyTour) {
            setCurrentTour(anyTour)
            return
          }
        }
        throw error
      }

      setCurrentTour(data)
    } catch (err: any) {
      console.error('Error fetching tour:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshTour()

    // Subscribe to changes in the tours table
    const subscription = supabase
      .channel('tours')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tours',
        filter: `user_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`
      }, async (payload) => {
        // Refresh tour data when changes occur
        await refreshTour()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <TourContext.Provider 
      value={{ 
        currentTour, 
        setCurrentTour, 
        isLoading, 
        error,
        refreshTour
      }}
    >
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
} 
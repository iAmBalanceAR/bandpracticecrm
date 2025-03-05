"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { ProgressiveCard } from '../utils/progressive-card'
import { useData } from '../utils/data-provider'
import { BarChart3, TrendingUp, DollarSign, MapPin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

// Define gig type based on the data structure we're using
interface Gig {
  id: string;
  title: string;
  gig_date: string;
  contract_total?: number;
  deposit_amount?: number;
  open_balance?: number;
  [key: string]: any; // Allow for other properties
}

// Define proper types for route information
interface RouteStop {
  id: string;
  name: string;
  date: string;
}

interface RouteInfo {
  totalMileage: number;
  distances: number[];
  stops: RouteStop[];
}

export const AnalyticsCard: React.FC = () => {
  const { gigs, venues, isLoading } = useData()
  const router = useRouter()
  
  // Initialize with proper types
  const [routeInfo, setRouteInfo] = useState<RouteInfo>({
    totalMileage: 0,
    distances: [] as number[],
    stops: [] as RouteStop[]
  })
  const [routeLoading, setRouteLoading] = useState(false)
  
  const isEmpty = gigs.length === 0 && !isLoading
  
  const emptyStateContent = (
    <div className="text-center p-4">
      <BarChart3 className="h-12 w-12 text-blue-500/50 mx-auto mb-2" />
      <h3 className="text-lg font-medium">No analytics available</h3>
      <p className="text-sm text-gray-400">Add gigs and venues to see analytics</p>
    </div>
  )
  
  // Calculate route information when gigs and venues are available
  useEffect(() => {
    if (gigs.length <= 1 || venues.length === 0 || isLoading) return
    
    const calculateRoutes = async () => {
      setRouteLoading(true)
      
      try {
        // Simulate route calculation
        // In a real implementation, this would call an API to calculate routes
        const sortedGigs = [...gigs].sort((a, b) => 
          new Date(a.gig_date).getTime() - new Date(b.gig_date).getTime()
        )
        
        // Generate random distances for demo purposes
        const distances: number[] = Array(sortedGigs.length - 1).fill(0).map(() => 
          Math.floor(Math.random() * 200) + 50
        )
        
        const totalMileage = distances.reduce((sum, distance) => sum + distance, 0)
        
        // Create properly typed stops array
        const stops: RouteStop[] = sortedGigs.map(gig => ({
          id: gig.id,
          name: gig.title,
          date: gig.gig_date
        }))
        
        setRouteInfo({
          totalMileage,
          distances,
          stops
        })
      } catch (error) {
        console.error('Error calculating routes:', error)
      } finally {
        setRouteLoading(false)
      }
    }
    
    calculateRoutes()
  }, [gigs, venues, isLoading])
  
  // Generate financial data for charts
  const financialData = React.useMemo(() => {
    if (gigs.length === 0) return []
    
    // Group gigs by month
    const gigsByMonth = gigs.reduce((acc: Record<string, any>, gig) => {
      const date = new Date(gig.gig_date)
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          name: new Date(date.getFullYear(), date.getMonth()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: 0,
          deposits: 0,
          balance: 0,
          count: 0
        }
      }
      
      acc[monthKey].revenue += gig.contract_total || 0
      acc[monthKey].deposits += gig.deposit_amount || 0
      acc[monthKey].balance += gig.open_balance || 0
      acc[monthKey].count += 1
      
      return acc
    }, {})
    
    // Convert to array and sort by date
    return Object.values(gigsByMonth).sort((a: any, b: any) => {
      const dateA = new Date(a.name)
      const dateB = new Date(b.name)
      return dateA.getTime() - dateB.getTime()
    })
  }, [gigs])
  
  return (
    <ProgressiveCard
      title="Tour Analytics"
      icon={<BarChart3 className="h-5 w-5" />}
      color="[#0088FE]"
      isLoading={isLoading || routeLoading}
      isEmpty={isEmpty}
      emptyState={emptyStateContent}
      actionButton={
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs border-blue-500/30 text-blue-400 hover:bg-blue-950/30"
          onClick={() => router.push('/analytics')}
        >
          Full Analytics
        </Button>
      }
    >
      <div className="p-3 space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800/50 rounded-md p-3 border border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Gigs</p>
                <h3 className="text-xl font-semibold text-white">{gigs.length}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-md p-3 border border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Revenue</p>
                <h3 className="text-xl font-semibold text-white">
                  ${gigs.reduce((sum, gig) => sum + (gig.contract_total || 0), 0).toLocaleString()}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-md p-3 border border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Tour Distance</p>
                <h3 className="text-xl font-semibold text-white">
                  {Math.round(routeInfo.totalMileage).toLocaleString()} mi
                </h3>
              </div>
            </div>
          </div>
        </div>
        
        {/* Revenue Chart */}
        {financialData.length > 0 && (
          <div className="bg-gray-800/50 rounded-md p-3 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Revenue by Month</h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="name" tick={{ fill: '#aaa', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#aaa', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#0088FE" />
                  <Bar dataKey="deposits" name="Deposits" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </ProgressiveCard>
  )
} 
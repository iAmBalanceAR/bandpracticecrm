"use client"

import * as React from "react"
import CustomCard from '@/components/common/CustomCard'
import { ChartContainer } from "@/components/ui/chart"
import { 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from "recharts"
import { useTour } from '@/components/providers/tour-provider'
import { gigHelpers, type Gig } from '@/utils/db/gigs'
import { format } from 'date-fns'
import { BarChart3, Loader2 } from "lucide-react"
import { FeedbackModal } from '@/components/ui/feedback-modal'
import { useAuth } from '@/components/providers/auth-provider'

interface RouteInfo {
  totalMileage: number;
  distances: number[];
  stops: any[];
}

type FeedbackModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'delete';
}

// Cache for route data to avoid recalculating on every render
const routeCache = new Map<string, RouteInfo>();

export default function AnalyticsCard() {
  const { currentTour } = useTour()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [gigs, setGigs] = React.useState<Gig[]>([])
  const [gigsLoading, setGigsLoading] = React.useState(true)
  const [routeLoading, setRouteLoading] = React.useState(false)
  const [routeInfo, setRouteInfo] = React.useState<RouteInfo>({
    totalMileage: 0,
    distances: [],
    stops: []
  })
  const [feedbackModal, setFeedbackModal] = React.useState<FeedbackModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  })

  // Optimized route calculation function with batched requests
  const calculateRoutes = React.useCallback(async (tourStops: any[]) => {
    if (tourStops.length <= 1) return null

    // Check cache first
    const cacheKey = tourStops.map(stop => `${stop.id}-${stop.lat}-${stop.lng}`).join('|');
    if (routeCache.has(cacheKey)) {
      return routeCache.get(cacheKey);
    }

    // Process in batches of 5 to avoid overwhelming the API
    const batchSize = 5;
    const distances: number[] = [];
    
    for (let i = 0; i < tourStops.length - 1; i += batchSize) {
      const batch = tourStops.slice(i, Math.min(i + batchSize, tourStops.length - 1));
      const batchPromises = batch.map(async (start, idx) => {
        const actualIdx = i + idx;
        if (actualIdx >= tourStops.length - 1) return null;
        
        const end = tourStops[actualIdx + 1];
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=false`;
        
        try {
          const response = await fetch(url);
          const data = await response.json();
          return { 
            index: actualIdx,
            distance: data.code === 'Ok' ? data.routes[0].distance * 0.000621371 : 0 
          };
        } catch (error) {
          console.error('Error calculating route:', error);
          return { index: actualIdx, distance: 0 };
        }
      });

      const batchResults = await Promise.all(batchPromises.filter(Boolean));
      
      // Sort results by index and add to distances array
      batchResults.sort((a, b) => {
        if (!a || !b) return 0;
        return a.index - b.index;
      });
      
      batchResults.forEach(result => {
        if (result) distances[result.index] = result.distance;
      });
    }

    const totalMileage = distances.reduce((sum, distance) => sum + distance, 0);
    const result = { distances, totalMileage, stops: tourStops };
    
    // Cache the result
    routeCache.set(cacheKey, result);
    
    return result;
  }, []);

  // Fetch gigs and calculate route info
  React.useEffect(() => {
    if (!isAuthenticated) {
      setGigsLoading(false)
      return
    }

    let isMounted = true;
    
    const loadGigs = async () => {
      if (!currentTour) return
      
      try {
        // Phase 1: Load basic gig data
        setGigsLoading(true)
        const tourGigs = await gigHelpers.getGigs(currentTour.id)
        if (!isMounted) return;
        setGigs(tourGigs)
        setGigsLoading(false)

        // Check if we have cached route data in sessionStorage
        const cacheKey = `tour-${currentTour.id}-routes`;
        const cachedRouteInfo = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null;
        
        if (cachedRouteInfo) {
          // Use cached data if available
          const parsedCache = JSON.parse(cachedRouteInfo);
          if (!isMounted) return;
          setRouteInfo(parsedCache);
          return;
        }

        // Phase 2: Load route data in the background
        if (tourGigs.length > 1) {
          if (!isMounted) return;
          setRouteLoading(true)
          
          // Use a timeout to allow the UI to update before starting the heavy calculation
          setTimeout(async () => {
            try {
              const { tourStops } = await gigHelpers.getGigsWithCoordinates(currentTour.id)
              
              if (!isMounted) return;
              
              if (tourStops.length > 1) {
                const routeData = await calculateRoutes(tourStops)
                if (!isMounted) return;
                
                if (routeData) {
                  const newRouteInfo = {
                    totalMileage: routeData.totalMileage,
                    distances: routeData.distances,
                    stops: tourStops
                  };
                  
                  setRouteInfo(newRouteInfo);
                  
                  // Cache the result in sessionStorage
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem(cacheKey, JSON.stringify(newRouteInfo));
                  }
                }
              }
            } catch (error) {
              console.error('Error calculating routes:', error);
              if (!isMounted) return;
              
              setFeedbackModal({
                isOpen: true,
                title: 'Route Calculation Error',
                message: 'Failed to calculate route information. Please try again later.',
                type: 'error'
              });
            } finally {
              if (isMounted) {
                setRouteLoading(false);
              }
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error loading gigs:', error)
        if (!isMounted) return;
        
        setFeedbackModal({
          isOpen: true,
          title: 'Error Loading Data',
          message: 'Failed to load tour analytics data. Please try again later.',
          type: 'error'
        })
        setGigsLoading(false)
        setRouteLoading(false)
      }
    }

    loadGigs()
    
    return () => {
      isMounted = false;
    };
  }, [currentTour, isAuthenticated, calculateRoutes])

  // Helper function for week number calculation
  const getWeekNumber = React.useCallback((date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }, []);

  // Memoized summary stats calculation
  const summaryStats = React.useMemo(() => {
    if (!gigs.length) return null

    // Calculate weekly breakdown with optimized reduce
    const weeklyData = gigs.reduce((acc: Record<string, any>, gig) => {
      const gigDate = new Date(gig.gig_date)
      const weekKey = `Week ${getWeekNumber(gigDate)} - ${format(gigDate, 'MMM yyyy')}`
      
      if (!acc[weekKey]) {
        acc[weekKey] = {
          contractTotal: 0,
          deposits: 0,
          paidDeposits: 0,
          openBalance: 0,
          gigCount: 0,
          name: weekKey,
          weekNumber: getWeekNumber(gigDate),
          year: gigDate.getFullYear(),
          month: gigDate.getMonth()
        }
      }
      
      const week = acc[weekKey]
      week.contractTotal += gig.contract_total
      week.paidDeposits += gig.deposit_paid ? (gig.deposit_amount || 0) : 0
      week.gigCount++
      week.remaining = week.contractTotal - week.paidDeposits
      
      return acc
    }, {})

    return { weeklyData }
  }, [gigs, getWeekNumber])

  // Memoized chart data with specific dependency
  const chartData = React.useMemo(() => {
    if (!summaryStats?.weeklyData) return []
    return Object.values(summaryStats.weeklyData)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        if (a.month !== b.month) return a.month - b.month
        return a.weekNumber - b.weekNumber
      })
  }, [summaryStats?.weeklyData])

  // Memoized tooltip components
  const FinancialTooltip = React.memo(({ active, payload, label }: any) => {
    if (active && payload && payload.length >= 2) {
      const total = Number(payload[0]?.value || 0) + Number(payload[1]?.value || 0)
      return (
        <div className="bg-[#1B2559] border border-gray-600 p-3 rounded-lg shadow-lg">
          <p className="text-white font-medium mb-1">{label}</p>
          <p className="text-sm text-gray-400 mb-2">
            {payload[0]?.payload?.gigCount || 0} gig{(payload[0]?.payload?.gigCount || 0) !== 1 ? 's' : ''}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry?.fill }}>
              {entry?.name}: ${(entry?.value || 0).toLocaleString()}
            </p>
          ))}
          <p className="text-sm text-purple-400 mt-1">
            Total: ${total.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  })

  const RouteTooltip = React.memo(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1B2559] border border-gray-600 p-3 rounded-lg shadow-lg">
          <p className="text-white font-medium mb-1">{label}</p>
          <p className="text-sm mb-1" style={{ color: '#008ffb' }}>
            Distance: {payload[0].value} miles
          </p>
          <p className="text-sm text-green-400">
            Est. Fuel Cost: ${payload[0].payload.fuelCost}
          </p>
        </div>
      )
    }
    return null
  })

  return (
    <CustomCard title="Tour Analytics Overview" cardColor="[#ff9920]">
      <div className="h-[430px] p-4 relative">
        {authLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="w-full h-full ">
            <BarChart3 className="w-24 h-24 mx-auto mb-4 text-[#008ffb] mt-20" />
            <p className="text-gray-400 text-center">Please sign in to view analytics</p>
          </div>
        ) : !currentTour ? (
          <div className="w-full h-full">
            <BarChart3 className="w-24 h-24 mx-auto mb-4 text-[#008ffb] mt-20" />
            <p className="text-gray-400 text-center">Tour Analytics will Auto-Populate when the Tour Calendar is Updated with Gigs.</p>
          </div>
        ) : (
          <>
            {gigsLoading && (
              <div className="absolute inset-0 bg-[#131d43]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-50 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-white font-medium">Loading analytics data...</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
              {/* Financial Chart */}
              <div className="h-full">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Financial Overview</h3>
                <div className="h-[360px] w-full border-2 border-solid border-[#6B7280] rounded-lg overflow-hidden bg-[#020817]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      style={{ backgroundColor: '#020817' }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#6B7280" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#9CA3AF"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Tooltip content={<FinancialTooltip />} />
                      <Legend />
                      <Bar 
                        dataKey="paidDeposits" 
                        name="Collected" 
                        stackId="a" 
                        fill="#10B981"
                      />
                      <Bar 
                        dataKey="remaining" 
                        name="Remaining" 
                        stackId="a" 
                        fill="#EF4444"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Mileage Chart */}
              <div className="h-full relative">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Route Overview</h3>
                {routeLoading && (
                  <div className="absolute inset-0 bg-[#131d43]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-50 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-white font-medium">Calculating route information...</p>
                  </div>
                )}
                <div className="h-[360px] w-full border-2 border-solid border-[#6B7280] rounded-lg bg-[#020817]">
                  <ResponsiveContainer width="100%" height="100%" style={{ border: '1px solid #6B7280' }}>
                    <LineChart 
                      data={routeInfo?.distances?.map((distance: number, index: number) => ({
                        name: `Stop ${index + 1} to ${index + 2}`,
                        distance: Math.round(distance),
                        fuelCost: Math.ceil(distance * 0.65)
                      })) || []}
                      margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                      style={{ backgroundColor: '#020817' }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#6B7280" style={{ border: '1px solid #6B7280' }} strokeWidth={1} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        height={20}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(value) => `${value} mi`}
                        width={80}
                      />
                      <Tooltip content={<RouteTooltip />} />
                      <Line 
                        type="monotone"
                        dataKey="distance" 
                        name="Distance" 
                        stroke="#008ffb"
                        strokeWidth={2}
                        dot={{ fill: '#008ffb', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
      />
    </CustomCard>
  )
}
"use client"

import * as React from "react"
import CustomCard from '@/components/common/CustomCard'
import { ChartContainer } from "@/components/ui/chart"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { useTour } from '@/components/providers/tour-provider'
import { gigHelpers, type Gig } from '@/utils/db/gigs'
import { format } from 'date-fns'
import { Loader2 } from "lucide-react"
import { FeedbackModal } from '@/components/ui/feedback-modal'

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

export default function AnalyticsCard() {
  const { currentTour } = useTour()
  const [gigs, setGigs] = React.useState<Gig[]>([])
  const [loading, setLoading] = React.useState(true)
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

  // Fetch gigs and calculate route info
  React.useEffect(() => {
    const loadGigs = async () => {
      if (!currentTour) return
      setLoading(true)
      try {
        const tourGigs = await gigHelpers.getGigs(currentTour.id)
        setGigs(tourGigs)
        
        // Calculate route info if we have gigs
        if (tourGigs.length > 1) {
          const { tourStops } = await gigHelpers.getGigsWithCoordinates(currentTour.id)
          
          if (tourStops.length > 1) {
            let totalMileage = 0
            const distances: number[] = []
            
            for (let i = 0; i < tourStops.length - 1; i++) {
              const start = tourStops[i]
              const end = tourStops[i + 1]
              const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=false`
              
              try {
                const response = await fetch(url)
                const data = await response.json()
                if (data.code === 'Ok') {
                  const distance = data.routes[0].distance * 0.000621371
                  distances.push(distance)
                  totalMileage += distance
                }
              } catch (error) {
                console.error('Error calculating route:', error)
                setFeedbackModal({
                  isOpen: true,
                  title: 'Route Calculation Error',
                  message: 'Failed to calculate route distance. Please try again later.',
                  type: 'error'
                })
              }
            }
            
            setRouteInfo({
              totalMileage,
              distances,
              stops: tourStops
            })
          }
        }
      } catch (error) {
        console.error('Error loading gigs:', error)
        setFeedbackModal({
          isOpen: true,
          title: 'Error Loading Data',
          message: 'Failed to load tour analytics data. Please try again later.',
          type: 'error'
        })
      } finally {
        setLoading(false)
      }
    }

    loadGigs()
  }, [currentTour])

  // Calculate financial summary statistics
  const summaryStats = React.useMemo(() => {
    if (!gigs.length) return null

    const monthlyData = gigs.reduce((acc: Record<string, any>, gig) => {
      const month = format(new Date(gig.gig_date), 'MMM yyyy')
      if (!acc[month]) {
        acc[month] = {
          contractTotal: 0,
          paidDeposits: 0,
          remaining: 0,
          gigCount: 0,
          name: month
        }
      }
      acc[month].contractTotal += gig.contract_total
      acc[month].paidDeposits += gig.deposit_paid ? (gig.deposit_amount || 0) : 0
      acc[month].gigCount++
      acc[month].remaining = acc[month].contractTotal - acc[month].paidDeposits
      return acc
    }, {})

    return { monthlyData }
  }, [gigs])

  // Convert monthly data for chart
  const chartData = React.useMemo(() => {
    if (!summaryStats) return []
    return Object.values(summaryStats.monthlyData)
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
  }, [summaryStats])

  return (
    <CustomCard title="Tour Analytics Overview" cardColor="[#ff9920]">
      <div className="h-[430px] p-4">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-gray-400">Loading analytics data...</p>
          </div>
        ) : !currentTour ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-400">Please select a tour to view analytics</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
            {/* Financial Chart */}
            <div className="h-full">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Financial Overview</h3>
              <div className="h-[360px] w-full border-2 border-solid border-[#6B7280] rounded-lg overflow-hidden bg-[#020817]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={chartData} 
                    margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                    style={{ backgroundColor: '#020817' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#6B7280" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      height={20}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      width={80}
                    />
                    <Tooltip content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#1B2559] border border-gray-600 p-3 rounded-lg shadow-lg">
                            <p className="text-white font-medium mb-1">{label}</p>
                            <p className="text-sm text-gray-400 mb-2">{payload[0].payload.gigCount} gigs</p>
                            {payload.map((entry: any, index: number) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name}: ${entry.value.toLocaleString()}
                              </p>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }} />
                    <Line 
                      type="monotone"
                      dataKey="contractTotal" 
                      name="Total Value" 
                      stroke="#9333EA"
                      strokeWidth={2}
                      dot={{ fill: '#9333EA', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line 
                      type="monotone"
                      dataKey="paidDeposits" 
                      name="Collected" 
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line 
                      type="monotone"
                      dataKey="remaining" 
                      name="Remaining" 
                      stroke="#EF4444"
                      strokeWidth={2}
                      dot={{ fill: '#EF4444', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mileage Chart */}
            <div className="h-full">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Route Overview</h3>
              <div className="h-[360px] w-full border  border-[#6B7280] rounded-lg  bg-[#020817]">
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
                    <Tooltip content={({ active, payload, label }) => {
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
                    }} />
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
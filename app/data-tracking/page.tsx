"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { Card } from "@/components/ui/card"
import { gigHelpers, type Gig } from '@/utils/db/gigs'
import { useTour } from '@/components/providers/tour-provider'
import { format } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  AreaChart,
  Area
} from 'recharts'
import { Loader2 } from "lucide-react"

interface RouteInfo {
  totalMileage: number;
  distances: number[];
  stops: any[];
}

export default function DataTrackingPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { currentTour } = useTour()
  const [gigs, setGigs] = React.useState<Gig[]>([])
  const [loading, setLoading] = React.useState(true)
  const [routeInfo, setRouteInfo] = React.useState<RouteInfo>({
    totalMileage: 0,
    distances: [],
    stops: []
  })

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/signin')
    }
  }, [isAuthenticated, authLoading, router])

  React.useEffect(() => {
    const loadGigs = async () => {
      if (!currentTour || !isAuthenticated) return
      setLoading(true)
      try {
        const tourGigs = await gigHelpers.getGigs(currentTour.id)
        setGigs(tourGigs)
        
        // Calculate route info if we have gigs
        if (tourGigs.length > 1) {
          // Get coordinates for each stop
          const { tourStops } = await gigHelpers.getGigsWithCoordinates(currentTour.id)
          
          if (tourStops.length > 1) {
            // Calculate distances between consecutive stops
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
                  const distance = data.routes[0].distance * 0.000621371 // Convert meters to miles
                  distances.push(distance)
                  totalMileage += distance
                }
              } catch (error) {
                console.error('Error calculating route:', error)
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
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      loadGigs()
    }
  }, [currentTour, isAuthenticated])

  // First, add this helper function near the top of the file
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Update the summaryStats calculation to group by weeks
  const summaryStats = React.useMemo(() => {
    if (!gigs.length) return null

    // Calculate total values
    const totalContractValue = gigs.reduce((sum, gig) => sum + gig.contract_total, 0)
    const totalDeposits = gigs.reduce((sum, gig) => sum + (gig.deposit_amount || 0), 0)
    const paidDeposits = gigs.reduce((sum, gig) => sum + (gig.deposit_paid ? (gig.deposit_amount || 0) : 0), 0)
    const totalOpenBalance = gigs.reduce((sum, gig) => sum + gig.open_balance, 0)

    // Calculate weekly breakdown
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
      
      acc[weekKey].contractTotal += gig.contract_total
      acc[weekKey].deposits += gig.deposit_amount || 0
      acc[weekKey].paidDeposits += gig.deposit_paid ? (gig.deposit_amount || 0) : 0
      acc[weekKey].openBalance += gig.open_balance
      acc[weekKey].gigCount++
      acc[weekKey].remaining = acc[weekKey].contractTotal - acc[weekKey].paidDeposits
      return acc
    }, {})

    return {
      totalContractValue,
      totalDeposits,
      paidDeposits,
      totalOpenBalance,
      weeklyData,
      gigCount: gigs.length,
      averageContractValue: totalContractValue / gigs.length,
      depositCollectionRate: (paidDeposits / totalDeposits) * 100 || 0,
      remainingCollectible: totalContractValue - paidDeposits
    }
  }, [gigs])

  // Update the chart data conversion
  const chartData = React.useMemo(() => {
    if (!summaryStats) return []
    return Object.values(summaryStats.weeklyData)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        if (a.month !== b.month) return a.month - b.month
        return a.weekNumber - b.weekNumber
      })
  }, [summaryStats])

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1B2559] border border-gray-600 p-3 rounded-lg shadow-lg">
          <p className="text-white font-medium mb-1">{label}</p>
          <p className="text-sm text-gray-400 mb-2">
            {payload[0].payload.gigCount} gig{payload[0].payload.gigCount !== 1 ? 's' : ''}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.fill }}>
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
          <p className="text-sm text-purple-400 mt-1">
            Total: ${(payload[0].value + payload[1].value).toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      {authLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : !isAuthenticated ? (
        <Card className="bg-[#192555] border-blue-800">
          <div className="p-6 text-center text-white">
            <p className="mb-4">Please sign in to access tour analytics.</p>
          </div>
        </Card>
      ) : (
        <>
      {/* Start Common Header Component */}
      <header className="flex items-center justify-between ml-0  pr-0 h-16 p-4 bg-[#0F1729] rounded-lg">
        <h1 className="text-4xl text-white">
          <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
            {currentTour?.title || 'No Tour Selected'} : Tour Analytics
          </span>
        </h1>
      </header>
      <div className="clear-both border-[#018FFB] border-b-2 -mt-6 mb-0 ml-8 mr-8 h-4">&nbsp;</div>
      {/* End Common Header Component */}

      {/* Main Container */}
      <div className="p-4 bg-[#0F1729] rounded-lg">
        {/* Interior Container */}
        <div className="bg-[#131d43] rounded-lg p-4 border border-blue-600">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <p className="text-gray-400">Loading data tracking information...</p>
            </div>
          ) : !currentTour ? (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-400">Please select a tour to view data tracking</p>
            </div>
          ) : (
            <>
              <div className="space-y-6 -mt-2">
                {/* Financial Section Header */}
                <div className="mb-6">
                  <h2 className="text-2xl text-white mb-2">Financial Overview</h2>
                  <div className="border-b-2 border-[#FFD700] w-full mb-4"></div>
                </div>

                {/* Primary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-[#1B2559] border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Total Tour Value</h3>
                    <p className="text-2xl font-bold text-white">
                      ${summaryStats?.totalContractValue.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {summaryStats?.gigCount} gigs
                    </p>
                  </Card>
                  <Card className="p-4 bg-[#1B2559] border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Deposits</h3>
                    <p className="text-2xl font-bold text-white">
                      ${summaryStats?.paidDeposits.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {summaryStats?.depositCollectionRate.toFixed(1)}% collected
                    </p>
                  </Card>
                  <Card className="p-4 bg-[#1B2559] border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Remaining to Collect</h3>
                    <p className="text-2xl font-bold text-white">
                      ${summaryStats?.remainingCollectible.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      From {summaryStats?.gigCount} gigs
                    </p>
                  </Card>
                  <Card className="p-4 bg-[#1B2559] border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Average Gig Value</h3>
                    <p className="text-2xl font-bold text-white">
                      ${Math.round(summaryStats?.averageContractValue || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Per performance
                    </p>
                  </Card>
                </div>

                {/* Monthly Chart and Details Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Monthly Chart */}
                  <Card className="p-4 bg-[#1B2559] border-gray-600">
                    <h3 className="text-lg font-semibold text-white mb-2">Monthly Revenue Breakdown</h3>
                    <div className="h-[360px] w-full border border-[#6B7280] rounded-lg overflow-hidden">
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
                          <Tooltip content={<CustomTooltip />} />
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
                  </Card>

                  {/* Monthly Details */}
                  <Card className="p-4 bg-[#1B2559] border-gray-600">
                    <h3 className="text-lg font-semibold text-white mb-0">Monthly Details</h3>
                    <div className="grid grid-cols-1 gap-0 h-[335px] overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                      {/* Column Headers */}
                      <div className="flex items-center justify-between px-2 py-0 border-b border-gray-600 sticky top-0 bg-[#1B2559] font-medium text-sm">
                        <div className="flex-1">
                          <p className="text-gray-400">Month</p>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-gray-400">Contract Value</p>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-gray-400">Balance Due</p>
                        </div>
                      </div>

                      {/* Table Rows */}
                      {summaryStats && Object.entries(summaryStats.weeklyData)
                        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                        .map(([week, data]: [string, any]) => (
                          <div 
                            key={week} 
                            className="flex items-center justify-between px-2 py-1 border-b border-gray-600 last:border-0 hover:bg-[#111C44] transition-colors cursor-pointer"
                          >
                            <div className="flex-1">
                              <h4 className="text-white font-medium text-sm">{week}</h4>
                              <p className="text-xs text-gray-400">{data.gigCount} gigs</p>
                            </div>
                            <div className="flex-1 text-right">
                              <p className="text-white font-medium text-sm">
                                ${data.contractTotal.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-400">
                                ${data.paidDeposits.toLocaleString()} collected
                              </p>
                            </div>
                            <div className="flex-1 text-right">
                              <p className="text-white font-medium text-sm">
                                ${(data.contractTotal - data.paidDeposits).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-400">
                                remaining
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              </div>

              {/* Mileage Analytics Section */}
              <div className="mt-12">
                <div className="space-y-6">
                  {/* Mileage Section Header */}
                  <div className="mb-6">
                    <h2 className="text-2xl text-white mb-2">Route Analytics</h2>
                    <div className="border-b-2 border-[#FFD700] w-full mb-4"></div>
                  </div>

                  {/* Mileage Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4 bg-[#1B2559] border-gray-600">
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Total Tour Mileage</h3>
                      <p className="text-2xl font-bold text-white">
                        {routeInfo?.totalMileage ? `${routeInfo.totalMileage.toFixed(1)} mi` : '0 mi'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {gigs.length} stops
                      </p>
                    </Card>
                    <Card className="p-4 bg-[#1B2559] border-gray-600">
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Average Per Stop</h3>
                      <p className="text-2xl font-bold text-white">
                        {routeInfo?.totalMileage && gigs.length > 1
                          ? `${(routeInfo.totalMileage / (gigs.length - 1)).toFixed(1)} mi`
                          : '0 mi'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        between venues
                      </p>
                    </Card>
                    <Card className="p-4 bg-[#1B2559] border-gray-600">
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Estimated Fuel Cost</h3>
                      <p className="text-2xl font-bold text-white">
                        ${routeInfo?.totalMileage ? Math.ceil(routeInfo.totalMileage * 0.65).toLocaleString() : '0'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        at $0.65/mile
                      </p>
                    </Card>
                    <Card className="p-4 bg-[#1B2559] border-gray-600">
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Estimated Drive Time</h3>
                      <p className="text-2xl font-bold text-white">
                        {routeInfo?.totalMileage
                          ? `${Math.floor(routeInfo.totalMileage / 55)}h ${Math.round((routeInfo.totalMileage / 55) % 1 * 60)}m`
                          : '0h 0m'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        at 55 mph average
                      </p>
                    </Card>
                  </div>

                  {/* Mileage Details and Chart */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Stop Details */}
                    <Card className="p-4 bg-[#1B2559] border-gray-600">
                      <h3 className="text-lg font-semibold text-white mb-0">Stop Details</h3>
                      <div className="grid grid-cols-1 gap-0 h-[335px] overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                        {/* Column Headers */}
                        <div className="flex items-center justify-between px-2 py-0 border-b border-gray-600 sticky top-0 bg-[#1B2559] font-medium text-sm">
                          <div className="flex-1">
                            <p className="text-gray-400">Stop</p>
                          </div>
                          <div className="flex-1 text-right">
                            <p className="text-gray-400">Distance</p>
                          </div>
                          <div className="flex-1 text-right">
                            <p className="text-gray-400">Drive Time</p>
                          </div>
                        </div>

                        {/* Table Rows */}
                        {gigs.map((gig, index) => (
                          <div 
                            key={gig.id} 
                            className="flex items-center justify-between px-2 py-1 border-b border-gray-600 last:border-0 hover:bg-[#111C44] transition-colors cursor-pointer"
                          >
                            <div className="flex-1">
                              <h4 className="text-white font-medium text-sm">{gig.venue}</h4>
                              <p className="text-xs text-gray-400">{format(new Date(gig.gig_date), 'MMM d, yyyy')}</p>
                            </div>
                            <div className="flex-1 text-right">
                              {index > 0 && routeInfo?.distances?.[index - 1] ? (
                                <p className="text-white font-medium text-sm">
                                  {Math.round(routeInfo.distances[index - 1])} mi
                                </p>
                              ) : (
                                <p className="text-xs text-gray-400">Start</p>
                              )}
                            </div>
                            <div className="flex-1 text-right">
                              {index > 0 && routeInfo?.distances?.[index - 1] ? (
                                <p className="text-white font-medium text-sm">
                                  {Math.floor(routeInfo.distances[index - 1] / 55)}h {Math.round((routeInfo.distances[index - 1] / 55) % 1 * 60)}m
                                </p>
                              ) : (
                                <p className="text-xs text-gray-400">-</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Mileage Chart */}
                    <Card className="p-4 bg-[#1B2559] border-gray-600">
                      <h3 className="text-lg font-semibold text-white mb-2">Distance Between Stops</h3>
                      <div className="h-[335px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            data={routeInfo?.distances?.map((distance: number, index: number) => ({
                              name: `Stop ${index + 1} to ${index + 2}`,
                              distance: Math.round(distance),
                              fuelCost: Math.ceil(distance * 0.65)
                            })) || []}
                            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                            style={{ backgroundColor: '#020817' }}
                          >
                            <CartesianGrid 
                              strokeDasharray="3 3" 
                              stroke="#6B7280" 
                              vertical={true}
                              horizontal={true}
                            />
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
                    </Card>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  )
}            

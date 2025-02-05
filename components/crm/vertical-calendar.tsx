"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { 
  ChevronUp, 
  ChevronDown, 
  MapPin, 
  Clock, 
  Music, 
  Mic2, 
  User, 
  Phone, 
  Mail, 
  FileText,
  Truck,
  UtensilsCrossed,
  Hotel,
  CheckCircle2,
  XCircle,
  DollarSign,
  Receipt,
  CreditCard,
  X,
  Loader2
} from 'lucide-react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { CustomDialog } from "@/components/ui/custom-dialog"
import { format } from "date-fns"
import { gigHelpers, type Gig } from '@/utils/db/gigs'
import { ScrollArea } from "@/components/ui/scroll-area"
import { createPortal } from 'react-dom'
import { useTour } from '@/components/providers/tour-provider'
import { useAuth } from '@/components/providers/auth-provider'

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

interface GigDay {
  date: string;
  gigs: Gig[];
}

const GigPreview = ({ gig }: { gig: Gig }) => (
  <div className="p-2 hover:bg-[#008ffb]/10 rounded">
    <h3 className="font-semibold text-white">{gig.title}</h3>
    <p className="text-sm text-white/80">{gig.venue}</p>
    <p className="text-xs text-white/60">{format(new Date(`2000-01-01 ${gig.set_time}`), 'h:mm a')}</p>
    <div className="flex gap-2 mt-1">
      {gig.crew_hands_in && <Truck className="w-3 h-3 text-[#008ffb]" />}
      {gig.meal_included && <UtensilsCrossed className="w-3 h-3 text-[#008ffb]" />}
      {gig.hotel_included && <Hotel className="w-3 h-3 text-[#008ffb]" />}
    </div>
  </div>
)

const GigDetailsModal = ({ gig, isOpen, onClose }: { gig: Gig | null, isOpen: boolean, onClose: () => void }) => {
  if (!gig) return null;
  
  return (
    <PortalContent>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[49] " />
      <div className=" fixed inset-0 flex items-center justify-center z-[50]">
        <CustomDialog isOpen={isOpen} onClose={onClose} title={gig.title}>
          <div className="space-y-4 p-4 bg-[#0f1729] text-white border border-[#008ffb] rounded-lg">
            <div className="flex  justify-between items-start mb-6">
          <h2 className="text-2xl font-mono">
            <span className="text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
              {gig.title}  
            </span>
          </h2>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="mt-1 hover:bg-[#008ffb]/20 hover:text-white transition-colors rounded-full p-2 h-auto"
          >
            <X className="h-5 w-5 text-[#008ffb] hover:text-white" />
          </Button>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-[#008ffb]" />
            <h3 className="font-semibold text-[#008ffb]">Venue</h3>
          </div>
          <p className="text-white">{gig.venue}</p>
          <p className="text-white/80">{gig.venue_address}</p>
          <p className="text-white/80">{gig.venue_city}, {gig.venue_state} {gig.venue_zip}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 border border-[#008ffb]/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#008ffb]" />
            <div className="flex items-center gap-1">
              <span className="text-sm text-white">Crew:</span>
              {gig.crew_hands_in ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-[#008ffb]" />
            <div className="flex items-center gap-1">
              <span className="text-sm text-white">Meal:</span>
              {gig.meal_included ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Hotel className="w-4 h-4 text-[#008ffb]" />
            <div className="flex items-center gap-1">
              <span className="text-sm text-white">Hotel:</span>
              {gig.hotel_included ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#008ffb]" />
              <h3 className="font-semibold text-[#008ffb]">Load In</h3>
            </div>
            <p className="text-white ml-6">{format(new Date(`2000-01-01 ${gig.load_in_time}`), 'h:mm a')}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mic2 className="w-4 h-4 text-[#008ffb]" />
              <h3 className="font-semibold text-[#008ffb]">Sound Check</h3>
            </div>
            <p className="text-white pl-7">{format(new Date(`2000-01-01 ${gig.sound_check_time}`), 'h:mm a')}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-4 h-4 text-[#008ffb]" />
              <h3 className="font-semibold text-[#008ffb]">Set Time</h3>
            </div>
            <p className="text-white pl-6">{format(new Date(`2000-01-01 ${gig.set_time}`), 'h:mm a')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-[#008ffb]" />
              <h3 className="font-semibold text-[#008ffb]">Contact</h3>
            </div>
            <div className="space-y-2 pl-7">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#008ffb]/70" />
                <p className="text-white">{gig.contact_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#008ffb]/70" />
                <p className="text-white/80">{gig.contact_phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#008ffb]/70" />
                <p className="text-white/80">{gig.contact_email}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-[#008ffb]" />
              <h3 className="font-semibold text-[#008ffb]">Financial</h3>
            </div>
            <div className="space-y-2 pl-7">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#008ffb]/70" />
                <div className="flex items-center gap-2">
                  <span className="text-[#008ffb] text-sm">Deposit:</span>
                  <span className="text-white">${gig.deposit_amount || '0'}</span>
                  {gig.deposit_paid ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 ml-2" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 ml-2" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#008ffb]/70" />
                <div>
                  <span className="text-[#008ffb] text-sm">Contract Total:</span>
                  <span className="text-white ml-2">${gig.contract_total}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#008ffb]/70" />
                <div>
                  <span className="text-[#008ffb] text-sm">Balance:</span>
                  <span className="text-white ml-2">${gig.open_balance}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {gig.gig_details && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-[#008ffb]" />
              <h3 className="font-semibold text-[#008ffb]">Details</h3>
            </div>
            <p className="text-white whitespace-pre-line pl-7">{gig.gig_details}</p>
          </div>
        )}
      </div>
        </CustomDialog>
    </div>
    </PortalContent>
  )
}

const PortalContent = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="relative">
      {children}
    </div>,
    document.body
  )
}

const VerticalCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [gigsByDate, setGigsByDate] = useState<Record<string, Gig[]>>({})
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [api, setApi] = useState<any>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [popoverPosition, setPopoverPosition] = useState<{ x: number, y: number } | null>(null)

  // Add click handler to close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectedDate) {
        setSelectedDate(null)
        setPopoverPosition(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [selectedDate])

  useEffect(() => {
    if (!isAuthenticated) return

    const loadGigs = async () => {
      try {
        setError(null)
        setIsLoading(true)
        const gigs = await gigHelpers.getGigs()
        const groupedGigs = gigs.reduce((acc: Record<string, Gig[]>, gig: Gig) => {
          const date = gig.gig_date.split('T')[0]
          if (!acc[date]) {
            acc[date] = []
          }
          acc[date].push(gig)
          return acc
        }, {})
        setGigsByDate(groupedGigs)
      } catch (err) {
        console.error('Error loading gigs:', err)
        setError('Failed to load gigs')
      } finally {
        setIsLoading(false)
      }
    }

    loadGigs()
  }, [isAuthenticated])

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <p className="text-gray-400">Please sign in to view the calendar</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-400">Loading calendar...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getMonthData = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = getDaysInMonth(date)
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    return { year, month, days, firstDayOfMonth }
  }

  const renderMonth = (date: Date) => {                                                                                                                             
    const { year, month, days, firstDayOfMonth } = getMonthData(date)
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <div className="bg-black pt-2 pl-2 pb-0 rounded-lg w-[100%]">
        <h3 className="m- p-o text-xl font-mono text-white text-shadow-black text-shadow-sm">
          {monthNames[month]} {year}
        </h3>
        <div className="bg-black grid grid-cols-7 gap-1 mb-0">
          {weekdays.map(day => (
            <div key={day} className="font-mono m-0 p-0 text-lg text-center font-semibold text-black bg-amber-200">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 p-1">
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="h-8"></div>
          ))}
          {days.map(day => renderDay(day, month, year))}
        </div>
      </div>
    )
  }

  const renderDay = (day: number, month: number, year: number) => {
    const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd')
    const gigsForDay = gigsByDate[dateStr] || []
    const hasGigs = gigsForDay.length > 0

    return (
      <div
        onClick={(e) => {
          e.stopPropagation()
          if (hasGigs) {
            const rect = e.currentTarget.getBoundingClientRect()
            setPopoverPosition({ x: rect.right + 5, y: rect.top })
            setSelectedDate(selectedDate === dateStr ? null : dateStr)
          }
        }}
        className={`h-8 flex items-center justify-center text-sm hover:text-black hover:bg-yellow-400 hover:rounded-sm font-semibold cursor-pointer transition-colors relative
          ${hasGigs ? 'bg-yellow-600 text-black rounded-sm' : 'text-white'}`}
      >
        {day}
        {hasGigs && gigsForDay.length > 1 && (
          <span className="absolute -top-1 -right-1 bg-[#008ffb] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {gigsForDay.length}
          </span>
        )}
        {hasGigs && selectedDate === dateStr && popoverPosition && (
          <PortalContent>
            <div 
              style={{ 
                position: 'fixed',
                left: `${popoverPosition.x}px`,
                top: `${popoverPosition.y}px`,
                zIndex: 50
              }}
              className="w-72 bg-[#0f1729] border border-[#008ffb] p-3 shadow-lg shadow-[#008ffb]/20 rounded-lg relative"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedDate(null)
                  setPopoverPosition(null)
                }}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[#0f1729] border border-[#008ffb] hover:bg-[#008ffb]/20 p-1"
              >
                <X className="h-4 w-4 text-[#008ffb]" />
              </Button>
              <div className="max-h-fit">
                {gigsForDay.map((gig, index) => (
                  <div key={index} className="mb-3 last:mb-0">
                    <div className="space-y-2 hover:bg-[#008ffb]/10 rounded-lg transition-colors p-2">
                      {/* Header */}
                      <div className="border-l-2 border-[#008ffb] pl-2">
                        <h3 className="font-semibold text-white text-base leading-tight truncate">{gig.title}</h3>
                        <p className="text-[#008ffb] text-sm font-medium truncate">{gig.venue}</p>
                      </div>

                      {/* Times */}
                      <div className="text-xs space-y-1 pl-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[#008ffb]">Load In:</span>
                          <span className="text-white/90">
                            {format(new Date(`2000-01-01 ${gig.load_in_time}`), 'h:mm a')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#008ffb]">Sound Check:</span>
                          <span className="text-white/90">
                            {format(new Date(`2000-01-01 ${gig.sound_check_time}`), 'h:mm a')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#008ffb]">Set Time:</span>
                          <span className="text-white/90">
                            {format(new Date(`2000-01-01 ${gig.set_time}`), 'h:mm a')}
                          </span>
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="text-xs pl-3 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[#008ffb]">Contact:</span>
                          <span className="text-white/90 truncate">{gig.contact_name}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-1 text-white text-xs hover:text-white hover:bg-[#008ffb]/20 border border-[#008ffb]/30"
                        onClick={() => {
                          setSelectedGig(gig)
                          setIsModalOpen(true)
                          setSelectedDate(null)
                        }}
                      >
                        View Full Details
                      </Button>
                    </div>

                    {index < gigsForDay.length - 1 && (
                      <div className="my-2 border-t border-[#008ffb]/20" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </PortalContent>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        orientation="vertical"
        className=""
      >
        <CarouselContent className="-mt-1 max-h-[401px] m-auto">
          {[0, 1, 2].map((_, index) => {
            const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + index, 1)
            return (
              <CarouselItem key={index} className="pt-1 md:basis-1/2">
                {renderMonth(monthDate)}
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-1/2 top-5 -translate-x-1/2 -translate-y-full z-10 hover:bg-transparent [&_svg]:!size-8 hover:text-yellow-400"
        onClick={() => {
          api?.scrollPrev()
        }}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-5 left-1/2 -translate-x-1/2 translate-y-full z-10 hover:bg-transparent [&_svg]:!size-8  hover:text-yellow-400"
        onClick={() => {
          api?.scrollNext()
        }}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
          <GigDetailsModal
            gig={selectedGig}
            isOpen={isModalOpen}
            onClose={() => {
          setIsModalOpen(false)
          setSelectedGig(null)
            }}
          />
    </div>
  )
}

export default VerticalCalendar
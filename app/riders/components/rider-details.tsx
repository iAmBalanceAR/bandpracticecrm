"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { 
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
  ArrowLeft,
  FileSpreadsheet,
  Monitor,
  Settings,
  Speaker,
  Sliders,
  LucideAlarmClockCheck,
  LucideAlarmClockMinus,
  LucideAlarmClockPlus,
  Mic,
  Lightbulb,
  Plug,
  Plus,
  DoorOpen,
  Coffee,
  Wine,
  UtensilsCrossed as Meals,
  Car,
  ParkingSquare,
  Shield,
  ShoppingBag,
  List,
  ExternalLink,
  Volume2
} from 'lucide-react'
import { format } from "date-fns"
import { useRouter } from 'next/navigation'
import { TechnicalRiderDetails, HospitalityRiderDetails, Setlist, SetlistItem, InputListRow } from '../types'
import { StagePlot, StagePlotItem } from '@/app/stage-plot/types'
import { ScrollArea } from "@/components/ui/scroll-area"
import StageGrid from '@/app/stage-plot/components/stage-grid'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckmarkIcon } from 'react-hot-toast'
import { InputList } from './input-list'

interface RiderDetailsProps {
  type: 'technical' | 'hospitality'
  details: {
    id?: string
    rider_id: string
    sections?: RiderSection[]
    input_list?: InputListRow[]
  }
  gig?: any
  stagePlot?: StagePlot
  stagePlotItems?: StagePlotItem[]
  setlist?: Setlist
  setlistItems?: SetlistItem[]
}

interface RiderSection {
  id: string
  name: string
  sort_order: number
  is_custom: boolean
  is_default: boolean
  content: Record<string, any>
}

export function RiderDetails({ 
  type, 
  details, 
  gig, 
  stagePlot, 
  stagePlotItems = [], 
  setlist, 
  setlistItems = [] 
}: RiderDetailsProps) {
  // Debug logs
  console.log('Setlist:', setlist)
  console.log('Setlist Items:', setlistItems)

  // Calculate dimensions based on 16:9 ratio for stage plot
  const plotHeight = 430 - 40 // Same as stage-plot-card
  const plotWidth = Math.floor((plotHeight * 16) / 9)
  const tableWidth = `calc(100% - ${plotWidth}px - 1rem)` // Full width minus plot width and gap

  const renderSectionContent = (section: RiderSection) => {
    if (!section.content) return null

    return (
      <div key={section.id} className="mb-6 last:mb-0">
        <div className="flex items-center gap-2 mb-2">
          <Plus className="w-4 h-4 text-[#008ffb] -mt-[12px]" />
          <h4 className="text-white font-mono text-xl text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black font-semibold w-full">{section.name}
          <div className="border-[#ff9920] border-b-2 -mt-[9px] mb-4 w-[100%] h-2"></div>
          </h4>
        </div>
        <div 
          className="text-white/80 whitespace-pre-line pl-6"
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
      </div>
    )
  }

  // Empty handlers for StageGrid props since this is view-only
  const noopHandler = () => {}

  // Helper function to format duration
  const formatDuration = (duration: string) => {
    if (!duration) return '--:--'
    // Duration comes as PostgreSQL interval, format it as mm:ss
    const match = duration.match(/(\d+):(\d+):(\d+)/)
    if (match) {
      const [_, hours, minutes, seconds] = match
      const totalMinutes = parseInt(hours) * 60 + parseInt(minutes)
      return `${totalMinutes}:${seconds.padStart(2, '0')}`
    }
    return duration
  }

  // Helper function to check if setlist data is valid
  const hasValidSetlistData = setlist && setlistItems && setlistItems.length > 0

  return (
    <div className="space-y-6">
      {/* Gig Details - Full Width */}
      {gig && (
        <div className="border border-[#008ffb]/20 rounded-lg bg-[#0f1729] w-full">
          <div  className="bg-[#1F2937] p-2 border-b border-[#008ffb]/20 flex">
            <Music className="w-5 h-5 text-[#008ffb]" />
            <h3 className="font-semibold text-white text-lg pl-2  text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">Gig Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
            {/* Venue */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 border-b border-[#008ffb]/20">
                <MapPin className="w-4 h-4 text-[#008ffb]" />
                <h4 className="font-mono text-xl text-[#008ffb] text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">Venue</h4>
              </div>
              <div className="space-y-2 pl-4">
                <p className="text-white text-lg font-mono text-shadow-sm -text-shadow-x-2 text-shadow-y-2 nowrap text-shadow-black">{gig.venue}<br  />
                <span className="text-white/80  text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black text-sm">{gig.venue_address}</span><br />
                <span className="text-white/80  text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black text-sm">{gig.venue_city}, {gig.venue_state} {gig.venue_zip}</span>
                </p>
              </div>
            </div>

            {/* Times */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2 border-b border-[#008ffb]/20">
                  <Clock className="w-4 h-4 text-[#008ffb]" />
                  <h4 className="font-mono text-xl text-[#008ffb] text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">Schedule</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-3 items-baseline p-0 m-0">
                    <LucideAlarmClockCheck  className="w-4 h-4 text-[#008ffb]" /><span className="text-[#008ffb] text-base flex-1">Load In:</span>
                    <span className="text-white flex-1">{format(new Date(`2000-01-01 ${gig.load_in_time}`), 'h:mm a')}</span>
                  </div>
                  <div className="flex gap-3 items-center p-0 m-0">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-[#008ffb] text-base flex-1">Sound Check:</span>
                    <span className="text-white flex-1">{format(new Date(`2000-01-01 ${gig.sound_check_time}`), 'h:mm a')}</span>
                  </div>
                  <div className="flex gap-3 items-center p-0 m-0">
                    <Volume2  className="w-4 h-4 text-[#008ffb]" /><span className="text-[#008ffb] text-base flex-1">Set Time:</span>
                    <span className="text-white flex-1">{format(new Date(`2000-01-01 ${gig.set_time}`), 'h:mm a')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Amenities */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2 border-b border-[#008ffb]/20">
                  <User className="w-4 h-4 text-[#008ffb]" />
                  <h4 className="font-mono text-xl text-[#008ffb] text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">Contact</h4>
                </div>
                <div className="space-y-2 pl-0">
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
              </div>
              {/* Financials */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 border-b border-[#008ffb]/20">
                    <DollarSign className="w-4 h-4 text-[#008ffb]" />
                    <h4 className="font-mono text-xl text-[#008ffb] text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">Financials</h4>
                  </div>
                  <div className="space-y-2 pl-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[#008ffb] text-base flex-1">Contract Total:</span>
                    <span className="text-white flex-1">${gig.contract_total}</span>
                  </div>
                  <div className="flex items-center gap-2 ">
                    <span className="text-[#008ffb] text-base flex-1">Deposit:</span>
                    <span className="text-white flex-1">${gig.deposit_amount}</span>
                  </div>
                  <div className="flex items-center gap-2 border-b border-[#008ffb]/50">
                    <span className="text-[#008ffb] text-xs flex-1">Paid?</span>
                    <span className="text-white flex-1">
                      {gig.deposit_paid ? <CheckCircle2 className="w-4 h-4 text-green-500 mb-2" /> : <XCircle className="w-4 h-4 text-red-500 mb-2" />}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#008ffb] text-lg font-mono flex-1">Balance:</span>
                    <span className="text-lg font-mono text-red-600 flex-1">
                      ${gig.deposit_paid ? (gig.contract_total - gig.deposit_amount) : gig.contract_total}
                    </span>
                  </div>
                </div>
              </div>
              </div>
              </div>
              <div className="px-4 pb-4 pt-0 m-0">
              <div className="grid grid-cols-4 gap-4 border border-[#008ffb]/20 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#008ffb]" />
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-white">Crew In:</span>
                    {gig.crew_hands_in ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#008ffb]" />
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-white">Crew Out:</span>
                    {gig.crew_hands_out ? (
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
          </div>
        </div>
      )}

      {/* Stage Plot and Setlist Section */}
      {type === 'technical' && (
        <div className="min-h-[430px] flex gap-4">
          {/* Setlist */}
          {hasValidSetlistData ? (
            <div 
              style={{ width: tableWidth }}
              className="border border-solid border-gray-500 rounded-lg overflow-hidden flex flex-col bg-[#030817]"
            >
                <div className="bg-[#1F2937] p-2 border-b border-gray-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-[#008ffb]  text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black" />
                    <h3 className="text-lg font-semibold text-white  text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">{setlist.title || 'Untitled Setlist'}</h3>
                  </div>
                  {setlist?.id && (
                    <Link 
                      href={`/setlist/${setlist.id}`}
                      className="text-[#008ffb] hover:text-[#008ffb]/80 flex items-center gap-1"
                    >
                      <span className="text-sm">View Full Setlist</span>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <Table className='border-gray-500 border-b'>
                  <TableHeader>
                    <TableRow className="bg-[#1F2937] text-gray-100 border-b border-gray-500">
                      <TableHead className="w-12"><span className='text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black'>#</span></TableHead>
                      <TableHead><span className='text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black'>Song</span></TableHead>
                      <TableHead className="w-24"><span className='text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black'>Duration</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {setlistItems.map((item, index) => (
                      <TableRow key={item.id} className="bg-[#030817] border-gray-500">
                        <TableCell className="text-white font-mono w-12">{index + 1}</TableCell>
                        <TableCell className="text-white">{item.title || 'Untitled'}</TableCell>
                        <TableCell className="text-white w-24">{formatDuration(item.duration)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div 
              style={{ width: tableWidth }}
              className="border border-solid border-gray-500 rounded-lg overflow-hidden flex flex-col"
            >
              <div className="bg-[#1F2937] p-4 border-b border-gray-500">
                <div className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-[#008ffb]" />
                  <h3 className="text-lg font-semibold text-white">No Setlist Available</h3>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <p>No songs in the setlist</p>
              </div>
            </div>
          )}

          {/* Stage Plot */}
          {stagePlot && stagePlotItems && (
            <div 
              style={{ width: plotWidth }}
              className="border border-gray-500 rounded-lg bg-[#111827] overflow-hidden flex flex-col"
            >
              <div className="bg-[#1F2937] p-2 border-b border-gray-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-[#008ffb]  text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black" />
                    <h3 className="text-lg font-semibold text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">{stagePlot.name}</h3>
                  </div>
                  <Link 
                    href={`/stage-plot/${stagePlot.id}`}
                    className="text-[#008ffb] hover:text-[#008ffb]/80 flex items-center gap-1"
                  >
                    <span className="text-sm">View Full Plot</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="flex-1">
                <StageGrid 
                  items={stagePlotItems}
                  selectedItem={null}
                  onSelectItem={noopHandler}
                  onPositionChange={noopHandler}
                  onSizeChange={noopHandler}
                  onRotationChange={noopHandler}
                  onDeleteItem={noopHandler}
                  readOnly={true}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input List Section */}
      {type === 'technical' && details?.input_list && details.input_list.length > 0 && (
        <div className="border border-gray-500 rounded-lg overflow-hidden flex flex-col bg-[#030817]">
          <div className="bg-[#1F2937] p-2 border-b border-gray-500">
            <div className="flex items-center gap-2">
              <List className="h-5 w-5 text-[#008ffb] text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black" />
              <h3 className="text-lg font-semibold text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">Input List</h3>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-[80px_1fr_1fr] gap-4 items-center font-semibold text-sm text-gray-400 mb-2 px-2">
              <div>CH</div>
              <div>INSTRUMENT</div>
              <div>MICROPHONE</div>
            </div>
            <div className="space-y-1">
              {details.input_list.map((row) => (
                <div key={row.id} className="grid grid-cols-[80px_1fr_1fr] gap-4 items-center text-sm bg-[#111827] p-2 rounded">
                  <div className="text-white font-mono">{row.channel_number}</div>
                  <div className="text-white">{row.instrument}</div>
                  <div className="text-white">{row.microphone}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rider Information - Full Width */}
      <div className="border border-gray-500 rounded-lg p-0 bg-[#0f1729] w-full">
      <div className="flex items-center bg-[#1F2937] p-2 border-b border-gray-500">
          <FileText className="w-5 h-5 text-[#008ffb] text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black" />
          <h3 className="pl-2 font-semibold text-white text-lg  text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">Rider Information</h3>
        </div>
        <ScrollArea className="p-4">
          {details.sections?.sort((a, b) => a.sort_order - b.sort_order).map(section => renderSectionContent(section))}
        </ScrollArea>
      </div>
    </div>
  )
} 
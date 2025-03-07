"use client"

import React from 'react'
import { Card } from "@/components/ui/card"
import { useTour } from '@/components/providers/tour-provider'
import { MapPin, Calendar, Clock, Phone, Mail, User, DollarSign, Navigation } from 'lucide-react'

interface ReportPreviewProps {
  data: any; // TODO: Add proper type
}

export function ReportPreview({ data }: ReportPreviewProps) {
  const { currentTour } = useTour()

  if (!data) return null

  return (
    <div className="space-y-8">
      {/* Tour Information */}
      <Card className="p-6 bg-[#1B2559] border-none shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white">{data.tourInfo.title}</h3>
            {data.tourInfo.description && (
              <p className="text-gray-400 mt-2 whitespace-pre-wrap">{data.tourInfo.description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Total Distance</p>
            <p className="text-xl font-bold text-white">{Math.ceil(data.tourInfo.totalMileage)} miles</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center text-gray-300">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Start: {data.tourInfo.startDate}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-gray-300">
              <Calendar className="w-4 h-4 mr-2" />
              <span>End: {data.tourInfo.endDate}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Gigs */}
      <Card className="p-6 bg-[#1B2559] border-none shadow-lg">
        <h3 className="text-xl font-semibold mb-6 text-white flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Tour Schedule
        </h3>
        <div className="space-y-6">
          {data.gigs.map((gig: any, index: number) => (
            <div key={index} className="border-b border-gray-700 pb-6 last:border-0 last:pb-0">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-semibold text-white">{gig.venue}</h4>
                <div className="text-right">
                  <p className="text-sm text-gray-400">{gig.date}</p>
                  {gig.distanceFromPrevious && (
                    <p className="text-sm text-blue-400">{Math.ceil(gig.distanceFromPrevious)} miles from previous</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-300">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Load In: {gig.loadIn}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Set Time: {gig.setTime}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="whitespace-pre-wrap">{gig.address}</span>
                  </div>
                </div>
                {gig.contactInfo && (
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-300">
                      <User className="w-4 h-4 mr-2" />
                      <span>{gig.contactInfo.name}</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Mail className="w-4 h-4 mr-2" />
                      <span>{gig.contactInfo.email}</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{gig.contactInfo.phone}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Directions */}
      {data.directions && (
        <Card className="p-6 bg-[#1B2559] border-none shadow-lg">
          <h3 className="text-xl font-semibold mb-6 text-white flex items-center">
            <Navigation className="w-5 h-5 mr-2" />
            Driving Directions
          </h3>
          <div className="space-y-8">
            {data.directions.map((leg: any, index: number) => (
              <div key={index} className="border-b border-gray-700 pb-6 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-white flex items-center">
                    {leg.fromVenue} 
                    <Navigation className="w-4 h-4 mx-2 text-blue-400" /> 
                    {leg.toVenue}
                  </h4>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">{Math.ceil(leg.distance)} miles</p>
                    <p className="text-sm text-blue-400">{leg.estimatedTime}</p>
                  </div>
                </div>
                <ol className="list-decimal list-inside text-gray-300 space-y-2 ml-4">
                  {leg.route.map((step: string, stepIndex: number) => (
                    <li key={stepIndex} className="pl-2">{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Financials */}
      {data.financials && (
        <Card className="p-6 bg-[#1B2559] border-none shadow-lg">
          <h3 className="text-xl font-semibold mb-6 text-white flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Financial Summary
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-[#2D3867] rounded-lg">
              <p className="text-gray-400 text-sm">Total Deposits</p>
              <p className="text-2xl font-bold text-white">${data.financials.totalDeposits.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-[#2D3867] rounded-lg">
              <p className="text-gray-400 text-sm">Total Payments</p>
              <p className="text-2xl font-bold text-white">${data.financials.totalPayments.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-[#2D3867] rounded-lg">
              <p className="text-gray-400 text-sm">Estimated Expenses</p>
              <p className="text-2xl font-bold text-white">${data.financials.estimatedExpenses.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-[#2D3867] rounded-lg">
              <p className="text-gray-400 text-sm">Net Income</p>
              <p className="text-2xl font-bold text-white">${(data.financials.totalPayments - data.financials.estimatedExpenses).toFixed(2)}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
} 
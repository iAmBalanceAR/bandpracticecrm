"use client"

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import CustomSectionHeader from "@/components/common/CustomSectionHeader"
import { TourReportGenerator } from './components/tour-report-generator'

export default function TourExports() {
  return (
    <CustomSectionHeader title="Tour Route Exports" underlineColor="#0f1729">
      <Card className="bg-[#111C44] min-h-[500px] border-none p-0 m-0">
        <CardHeader className="pb-0 mb-0">
          <CardTitle className="flex justify-between items-center text-3xl font-bold">
            <div className="">
              <div className="flex flex-auto tracking-tight text-3xl">
                <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-white text-shadow-sm font-mono font-normal text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                  Tour Route Exports
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TourReportGenerator />
        </CardContent>
      </Card>
    </CustomSectionHeader>
  )
} 
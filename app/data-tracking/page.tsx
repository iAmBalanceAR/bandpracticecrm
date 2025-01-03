"use client"
import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import CustomSectionHeader from "@/components/common/CustomSectionHeader"
import DataTrackingComponent from "@/components/crm/data-tracking"
export default function DataTracking() {
  return (
    <CustomSectionHeader title="Data Tracking" underlineColor="#0f1729">
    <Card className="bg-[#111C44]  min-h-[500px] border-none p-0 m-0">
    <CardHeader className="pb-0 mb-0">
      <CardTitle className="flex justify-between items-center text-3xl font-bold">
        <div className="">
          <div className="flex flex-auto tracking-tight text-3xl">
            <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-white text-shadow-sm font-mono font-normal text-shadow-x-2 text-shadow-y-2 text-shadow-black">
              Data Tracking
            </span>
          </div>
        </div>
      </CardTitle>
    </CardHeader>
    <CardContent>
    <DataTrackingComponent />
  </CardContent>
  </Card>
  </CustomSectionHeader>
  )
}            

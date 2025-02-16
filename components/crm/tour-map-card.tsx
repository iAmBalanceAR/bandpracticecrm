"use client"

import * as React from "react"
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CustomCard from "@/components/common/CustomCard"

const TourMap = dynamic(() => import('./tour-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center">
      <span className="text-gray-500 dark:text-gray-400">Loading map...</span>
    </div>
  )
})

export default function TourMapCard() {
  return (
    <CustomCard 
      title="Tour Route Map"
      cardColor="[#ff9920]"
      addclassName="md:col-span-2"
    >
      <TourMap mode="simple" showFutureOnly={true} />
    </CustomCard>
  )
}
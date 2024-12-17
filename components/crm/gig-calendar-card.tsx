import React from "react"
import CustomCard from '@/components/common/CustomCard'
import VerticalCalendar from "@/components/crm/vertical-calendar"

export default function GigCalendarCard() {
  return (
    <CustomCard 
      title="Gig Calendar" 
      cardColor="[#008ffb]"
    >
      <VerticalCalendar />
    </CustomCard>
  )
}
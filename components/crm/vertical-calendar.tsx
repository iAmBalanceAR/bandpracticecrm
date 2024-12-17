"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { ChevronUp, ChevronDown } from 'lucide-react'

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const VerticalCalendar = () => {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [daysWithGigs, setDaysWithGigs] = React.useState<number[]>([5, 12, 19, 26])
  const [api, setApi] = React.useState<any>()

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
          {days.map(day => (
            <div
              key={day}
              className={`h-8 flex items-center justify-center text-sm hover:text-black hover:bg-yellow-400 hover:rounded-sm font-semibold  cursor-pointer transition-colors ${
                daysWithGigs.includes(day) ? 'bg-yellow-600 text-black  rounded-sm' : ''
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative ">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        orientation="vertical"
        className=""
      >
        <CarouselContent className="-mt-1 max-h-[380px] m-auto">
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
        className="absolute left-1/2 top-3 -translate-x-1/2 -translate-y-full z-10 h-8 w-8 hover:bg-transparent"
        onClick={() => {
          api?.scrollPrev()
          const newDate = new Date(currentDate)
          newDate.setMonth(newDate.getMonth() - 1)
          setCurrentDate(newDate)
        }}
      >
        <ChevronUp color="white" className="h-6 w-6 text-gray-400 transition-colors hover:text-white" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute  bottom-0 left-1/2 -translate-x-1/2 translate-y-full z-10 hover:bg-transparent"  
        onClick={() => {
          api?.scrollNext()
          const newDate = new Date(currentDate)
          newDate.setMonth(newDate.getMonth() + 1)
          setCurrentDate(newDate)
        }}
      >
        <ChevronDown color="white" size={30}   />
         
      </Button>
    </div>
  )
}

export default VerticalCalendar
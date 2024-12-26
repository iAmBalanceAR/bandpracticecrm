"use client"

import React, { useState } from 'react'
import TourMapCard from "@/components/crm/tour-map-card"
import GigCalendarCard from "@/components/crm/gig-calendar-card"
import SavedVenuesCard from "@/components/crm/savedVenues"
import ContactsLeadsCard from "@/components/crm/contacts-leads-card"
import AnalyticsCard from "@/components/crm/analytics-card"
import NotesCard from "@/components/crm/notes-card"
import { CustomDialog } from "@/components/ui/custom-dialog"

export function Dashboard() {

const [errorModalOpen, setErrorModalOpen] = useState(false)
const [errorMessage, setErrorMessage] = useState('')



  const [contactsLeads, setContactsLeads] = React.useState([
    { id: 1, name: "John Doe", email: "johndoe@example.com", type: "Contact", status: "Active", priority: "High" },
    { id: 2, name: "Jane Smith", email: "janesmith@example.com", type: "Lead", status: "New", priority: "Normal" },
    { id: 3, name: "Mike Johnson", email: "mikejohnson@example.com", type: "Contact", status: "Active", priority: "Low" },
    { id: 4, name: "Sarah Brown", email: "sarahbrown@example.com", type: "Lead", status: "New", priority: "High" },
    { id: 5, name: "Chris Lee", email: "chrislee@example.com", type: "Contact", status: "Active", priority: "Normal" },
  ])

  const dismissContact = (id: number) => {
    setContactsLeads(contactsLeads.filter((contact: { id: number }) => contact.id !== id))
  }

  const analyticsData = [
    { month: "Jan", expenses: 2500, miles: 1200, days: 15, pay: 5000 },
    { month: "Feb", expenses: 2200, miles: 1500, days: 18, pay: 5500 },
    { month: "Mar", expenses: 2800, miles: 1800, days: 22, pay: 6200 },
    { month: "Apr", expenses: 3000, miles: 2000, days: 20, pay: 6800 },
    { month: "May", expenses: 2700, miles: 1700, days: 17, pay: 6000 },
    { month: "Jun", expenses: 3200, miles: 2200, days: 25, pay: 7500 },
  ]

  const chartConfig = {
    expenses: {
      label: "Expenses",
      color: "hsl(var(--chart-1))",
    },
    miles: {
      label: "Miles Driven",
      color: "hsl(var(--chart-2))",
    },
    days: {
      label: "Days on Road",
      color: "hsl(var(--chart-3))",
    },
    pay: {
      label: "Gig Pay",
      color: "hsl(var(--chart-4))",
    },
  }

  const getTotalAndAverage = (key: string) => {
    const total = analyticsData.reduce((sum, item) => sum + Number(item[key as keyof typeof analyticsData[0]]), 0)
    const average = total / analyticsData.length
    return { total, average }
  }

  const notes = [
    {
      id: 1,
      title: "Project Management Discussion",
      date: "2023-06-15",
      type: "Meeting",
      author: "Selvia Davis",
      authorInitials: "SD",
    },
    {
      id: 2,
      title: "New Project Invitation: Nexttask",
      date: "2023-06-14",
      type: "Invitation",
      author: "Bryan",
      authorInitials: "BR", 
    },
    {
      id: 3,
      title: "Project Management Updates",
      date: "2023-06-13",
      type: "Update",
      author: "John",
      authorInitials: "JO",
    },
  ]
   
  return (
    <>
      <div className=" relative float-left max-w-[1200px] mx-auto">

{/* Start Common Heder Component  */} 
        <header className=" flex items-center justify-between  ml-8 pr-0  h-16">
            <h1 className="text-4xl  text-white ">
              <span className=" text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                The Lowroad Tour : Dashboard
              </span>
          </h1>
        </header>
        <div className="clear-both border-[#d83b34] border-b-2 -mt-6 mb-0 ml-8 mr-8 h-4">&nbsp;</div>
{/* End Common Heder Component  */}
        <main className="clearboth p-4">
          <div className="w-full bg-[#0f1729] p-4">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <TourMapCard />
              </div>
              <div className="lg:col-span-1">
                <GigCalendarCard />
              </div>
            </div>  

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <SavedVenuesCard  />
              <ContactsLeadsCard contacts={contactsLeads} onDismiss={dismissContact} />
            </div>
            <div className="max-w-full mx-auto mt-6">
              <AnalyticsCard
                analyticsData={analyticsData}
                chartConfig={chartConfig}
                getTotalAndAverage={getTotalAndAverage}
              />
            </div>
              <div className="max-w-[1200px] mx-auto mt-6">
                <NotesCard />
              </div>
          </div>
        </main>
        <CustomDialog
          isOpen={!!errorMessage}
          onClose={() => setErrorMessage('')}
          title="Something Went Wrong..."
        >
          <div className="py-4 text-gray-200 whitespace-pre-line">
            {errorMessage}
          </div>
        </CustomDialog>
      </div>        
    </>
  )
}

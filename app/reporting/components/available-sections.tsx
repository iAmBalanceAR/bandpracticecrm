"use client"

import { ReportSectionType } from '../types'
import { Card } from "@/components/ui/card"
import { 
  BarChart3, 
  Calendar, 
  MapPin, 
  Users, 
  FileSpreadsheet,
  Map,
  Mic2,
  Contact,
  Plus
} from 'lucide-react'

interface AvailableSectionsProps {
  onAddSection: (type: ReportSectionType) => void;
}

const AVAILABLE_SECTIONS = [
  {
    type: 'financial' as ReportSectionType,
    title: 'Financial Summary',
    description: 'Revenue, expenses, and other financial metrics',
    icon: BarChart3
  },
  {
    type: 'schedule' as ReportSectionType,
    title: 'Schedule',
    description: 'Tour dates, load-in times, and set times',
    icon: Calendar
  },
  {
    type: 'venue' as ReportSectionType,
    title: 'Venues',
    description: 'Venue details and specifications',
    icon: MapPin
  },
  {
    type: 'leads' as ReportSectionType,
    title: 'Leads & Opportunities',
    description: 'Potential gigs and follow-ups',
    icon: Users
  },
  {
    type: 'technical' as ReportSectionType,
    title: 'Technical Requirements',
    description: 'Equipment and technical specifications',
    icon: FileSpreadsheet
  },
  {
    type: 'map' as ReportSectionType,
    title: 'Route Map',
    description: 'Visual tour route with distances',
    icon: Map
  },
  {
    type: 'stage-plot' as ReportSectionType,
    title: 'Stage Plot',
    description: 'Stage layouts and equipment placement',
    icon: Mic2
  },
  {
    type: 'contacts' as ReportSectionType,
    title: 'Contacts',
    description: 'Venue contacts and important numbers',
    icon: Contact
  }
]

export function AvailableSections({ onAddSection }: AvailableSectionsProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold mb-4">Available Sections</h3>
      <div className="space-y-2">
        {AVAILABLE_SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <Card
              key={section.type}
              className="p-4 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onAddSection(section.type)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{section.title}</p>
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {section.description}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 
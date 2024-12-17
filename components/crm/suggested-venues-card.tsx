import * as React from "react"
import { MoreVertical } from 'lucide-react'
import { Button } from "@/components/ui/button"
import CustomCard from "@/components/common/CustomCard"

interface Venue {
  id: number
  name: string
  type: string
  status: string
  priority: string
}

interface SuggestedVenuesCardProps {
  venues: Venue[]
  onDismiss: (id: number) => void
}

export default function SuggestedVenuesCard({ venues, onDismiss }: SuggestedVenuesCardProps) {
  return (
    <CustomCard 
      title="AI Research"
      cardColor="[#d83b34]"
      addclassName=""
    >
      <div className="rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#d1f5f0] text-[#111C44]">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium">Venue</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Type</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Priority</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((venue, index) => (
              <tr key={venue.id} className={index % 2 === 0 ? 'bg-[#1B2559]' : 'bg-[#111C44]'}>
                <td className="px-4 py-2 text-xs">{venue.name}</td>
                <td className="px-4 py-2 text-xs">{venue.type}</td>
                <td className="px-4 py-2 text-xs">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    venue.status === 'Active' ? 'bg-[#00e396] text-[#111C44]' : 'bg-[#ff9920] text-[#111C44]'
                  }`}>
                    {venue.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs">{venue.priority}</td>
                <td className="px-4 py-2 text-xs">
                  <Button variant="ghost" size="icon" onClick={() => onDismiss(venue.id)}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CustomCard>
  )
}
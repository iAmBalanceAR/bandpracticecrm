import * as React from "react"
import { MoreVertical } from 'lucide-react'
import { Button } from "../ui/button"
import CustomCard from '@/components/common/CustomCard'

interface Contact {
  id: number
  name: string
  email: string
  type: string
  status: string
  priority: string
}

interface ContactsLeadsCardProps {
  contacts: Contact[]
  onDismiss: (id: number) => void
}

export default function ContactsLeadsCard({ contacts, onDismiss }: ContactsLeadsCardProps) {
  return (
    <CustomCard 
      title="Contacts / Leads"
      cardColor="[#ff9920]"      
    >
      <div className="rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#d1f5f0] text-[#111C44]">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Type</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Priority</th>
              <th className="px-4 py-2 text-left text-xs font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact, index) => (
              <tr key={contact.id} className={index % 2 === 0 ? 'bg-[#1B2559]' : 'bg-[#111C44]'}>
                <td className="px-4 py-2 text-xs">{contact.name}</td>
                <td className="px-4 py-2 text-xs">{contact.email}</td>
                <td className="px-4 py-2 text-xs">{contact.type}</td>
                <td className="px-4 py-2 text-xs">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    contact.status === 'Active' ? 'bg-[#00e396] text-[#111C44]' : 'bg-[#ff9920] text-[#111C44]'
                  }`}>
                    {contact.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs">{contact.priority}</td>
                <td className="px-4 py-2 text-xs">
                  <Button variant="ghost" size="icon" onClick={() => onDismiss(contact.id)}>
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
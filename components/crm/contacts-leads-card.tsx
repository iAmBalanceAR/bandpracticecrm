"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Mail, Phone, Loader2 } from 'lucide-react'
import CustomCard from '@/components/common/CustomCard'
import createClient from '@/utils/supabase/client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Lead } from '@/app/types/lead'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ContactsLeadsCard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchLeads = async () => {
    console.log('Fetching leads...')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Current user:', session?.user?.email)

      console.log('Executing leads query...')
      const { data, error } = await supabase
        .rpc('get_leads')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Error fetching leads:', error)
        throw error
      }

      console.log('Leads data:', data)
      setLeads((data || []) as Lead[])
    } catch (error) {
      console.error('Error in fetchLeads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()

    const channel = supabase
      .channel('leads_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'leads' 
        }, 
        (payload) => {
          console.log('Realtime event received:', payload)
          fetchLeads()
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      console.log('Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <CustomCard 
      title="Latest Working Leads"
      cardColor="[#ff9920]"      
      addclassName="h-[332px] ] bg-[#020817]  mt-2"
    >
      <div className="h-[calc(370px-3.5rem)] overflow-y-auto">
        <Table className="w-full">
          <TableHeader className="text-black  bg-white sticky top-0 z-10">
            <TableRow>
              <TableHead className="bg-white p-[7px] pl-4 text-left text-xs font-medium">Title</TableHead>
              <TableHead className="bg-white p-2 pl-4 text-left text-xs font-medium">Contact</TableHead>
              <TableHead className="bg-white p-2 pl-4 text-left text-xs font-medium">Type</TableHead>
              <TableHead className="bg-white p-2 pl-4 text-left text-xs font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-0">
                <TableCell colSpan={4} className="px-4 py-8 border-0">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="border-0 px-4 py-8 text-center text-sm text-gray-400">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead, index) => (
                <TableRow key={lead.id}  className={cn(index % 2 === 0 ? 'bg-[#1B2559]' : 'bg-[#111C44]', 'border-0')}>
                  <TableCell className="p-[7px] pl-4 text-xs py-4 border-0">
                    <Link 
                      href={`/leads/${lead.id}`}
                      className="text-white hover:text-blue-300"
                    >
                      {lead.title}
                    </Link>
                  </TableCell>
                  <TableCell className="p-[7px] pl-4 text-xs py-4">
                    <div className="flex items-center gap-2">
                      {lead.contact_info.email && (
                        <a 
                          href={`mailto:${lead.contact_info.email}`}
                          className="inline-flex items-center gap-1 text-white hover:text-blue-300"
                        >
                          <Mail className="h-3 w-3" />
                        </a>
                      )}
                      {lead.contact_info.phone && (
                        <a 
                          href={`tel:${lead.contact_info.phone}`}
                          className="inline-flex items-center gap-1 text-white hover:text-blue-300"
                        >
                          <Phone className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-[7px] pl-4 text-xs py-4 capitalize">{lead.type.replace('_', ' ')}</TableCell>
                  <TableCell className="p-[7px] pl-4 text-xs py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                      lead.status === 'new' ? 'bg-blue-500 text-white' :
                      lead.status === 'contacted' ? 'bg-yellow-500 text-black' :
                      lead.status === 'in_progress' ? 'bg-purple-500 text-white' :
                      lead.status === 'negotiating' ? 'bg-orange-500 text-white' :
                      lead.status === 'won' ? 'bg-green-500 text-white' :
                      lead.status === 'lost' ? 'bg-red-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {lead.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </CustomCard>
  )
}
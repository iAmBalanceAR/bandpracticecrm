"use client"

import React from 'react'
import { ProgressiveCard } from '../utils/progressive-card'
import { useData } from '../utils/data-provider'
import { Users, User, Phone, Mail, Calendar, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

export const LeadsCard: React.FC = () => {
  const { leads, isLoading } = useData()
  const router = useRouter()
  
  const isEmpty = leads.length === 0 && !isLoading
  
  const emptyStateContent = (
    <div className="text-center p-4">
      <Users className="h-12 w-12 text-yellow-500/50 mx-auto mb-2" />
      <h3 className="text-lg font-medium">No leads added</h3>
      <p className="text-sm text-gray-400">Add contact leads to track potential bookings</p>
    </div>
  )
  
  // Get status color based on lead status
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'bg-blue-600 text-white'
      case 'contacted':
        return 'bg-yellow-600 text-white'
      case 'negotiating':
        return 'bg-purple-600 text-white'
      case 'booked':
        return 'bg-green-600 text-white'
      case 'closed':
        return 'bg-gray-600 text-white'
      default:
        return 'bg-gray-700 text-gray-300'
    }
  }
  
  return (
    <ProgressiveCard
      title="Contact Leads"
      icon={<Users className="h-5 w-5" />}
      color="[#FFC107]"
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyState={emptyStateContent}
      actionButton={
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs border-yellow-500/30 text-yellow-400 hover:bg-yellow-950/30"
          onClick={() => router.push('/leads')}
        >
          View All
        </Button>
      }
    >
      <div className="space-y-3 p-2">
        {leads.slice(0, 4).map((lead, index) => (
          <div 
            key={lead.id || index} 
            className="p-3 bg-gray-800/50 rounded-md border border-gray-700 hover:border-yellow-500/30 transition-colors cursor-pointer"
            onClick={() => router.push(`/leads/${lead.id}`)}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-yellow-900/30 flex items-center justify-center">
                  <User className="h-4 w-4 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{lead.name}</h3>
                  <p className="text-xs text-gray-400">{lead.company || 'Independent'}</p>
                </div>
              </div>
              
              <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(lead.status)}`}>
                {lead.status || 'New'}
              </span>
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-2">
              {lead.phone && (
                <div className="flex items-center text-xs text-gray-300">
                  <Phone className="h-3 w-3 text-yellow-400 mr-1 flex-shrink-0" />
                  <span className="truncate">{lead.phone}</span>
                </div>
              )}
              
              {lead.email && (
                <div className="flex items-center text-xs text-gray-300">
                  <Mail className="h-3 w-3 text-yellow-400 mr-1 flex-shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              
              {lead.followUpDate && (
                <div className="flex items-center text-xs text-gray-300">
                  <Calendar className="h-3 w-3 text-yellow-400 mr-1 flex-shrink-0" />
                  <span>
                    Follow-up: {format(new Date(lead.followUpDate), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
            
            {lead.notes && (
              <div className="mt-2 text-xs text-gray-400 line-clamp-1">
                {lead.notes}
              </div>
            )}
            
            <div className="mt-2 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-950/20 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/leads/${lead.id}`)
                }}
              >
                <span>Details</span>
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {leads.length > 4 && (
          <div className="text-center text-sm text-gray-400 pt-2">
            +{leads.length - 4} more leads
          </div>
        )}
      </div>
    </ProgressiveCard>
  )
} 
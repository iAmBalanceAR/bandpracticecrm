"use client"

import React from 'react'
import { ProgressiveCard } from '../utils/progressive-card'
import { useData } from '../utils/data-provider'
import { Building2, MapPin, Phone, Mail, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export const VenueListCard: React.FC = () => {
  const { venues, isLoading } = useData()
  const router = useRouter()
  
  const isEmpty = venues.length === 0 && !isLoading
  
  const emptyStateContent = (
    <div className="text-center p-4">
      <Building2 className="h-12 w-12 text-purple-500/50 mx-auto mb-2" />
      <h3 className="text-lg font-medium">No venues added</h3>
      <p className="text-sm text-gray-400">Add venue information to see them here</p>
    </div>
  )
  
  return (
    <ProgressiveCard
      title="Saved Venues"
      icon={<Building2 className="h-5 w-5" />}
      color="[#9C27B0]"
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyState={emptyStateContent}
      className="h-full min-h-[400px]"
      actionButton={
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs border-purple-500/30 text-purple-400 hover:bg-purple-950/30"
          onClick={() => router.push('/venues')}
        >
          View All
        </Button>
      }
    >
      <div className="space-y-4 p-3 h-[calc(100%-2rem)] overflow-auto">
        {venues.slice(0, 5).map((venue, index) => (
          <div 
            key={venue.id || index} 
            className="p-3 bg-gray-800/50 rounded-md border border-gray-700 hover:border-purple-500/30 transition-colors cursor-pointer"
            onClick={() => router.push(`/venues/${venue.id}`)}
          >
            <div className="flex justify-between items-start">
              <h3 className="text-white font-medium">{venue.name}</h3>
              <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                {venue.type || 'Venue'}
              </span>
            </div>
            
            <div className="mt-2 space-y-1">
              {(venue.address || venue.city || venue.state) && (
                <div className="flex items-center text-xs text-gray-300">
                  <MapPin className="h-3 w-3 text-purple-400 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {[
                      venue.address,
                      venue.city && venue.state ? `${venue.city}, ${venue.state}` : (venue.city || venue.state),
                      venue.zip
                    ].filter(Boolean).join(' ')}
                  </span>
                </div>
              )}
              
              {venue.phone && (
                <div className="flex items-center text-xs text-gray-300">
                  <Phone className="h-3 w-3 text-purple-400 mr-1 flex-shrink-0" />
                  <span>{venue.phone}</span>
                </div>
              )}
              
              {venue.email && (
                <div className="flex items-center text-xs text-gray-300">
                  <Mail className="h-3 w-3 text-purple-400 mr-1 flex-shrink-0" />
                  <span className="truncate">{venue.email}</span>
                </div>
              )}
              
              {venue.website && (
                <div className="flex items-center text-xs text-gray-300">
                  <ExternalLink className="h-3 w-3 text-purple-400 mr-1 flex-shrink-0" />
                  <a 
                    href={venue.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:underline truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {venue.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
            
            {venue.notes && (
              <div className="mt-2 text-xs text-gray-400 line-clamp-2">
                {venue.notes}
              </div>
            )}
            
            {venue.capacity && (
              <div className="mt-2 text-xs text-gray-400">
                <span className="text-purple-400">Capacity:</span> {venue.capacity}
              </div>
            )}
          </div>
        ))}
        
        {venues.length > 5 && (
          <div className="text-center text-sm text-gray-400 pt-2">
            +{venues.length - 5} more venues
          </div>
        )}
        
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-purple-500/30 text-purple-400 hover:bg-purple-950/30"
            onClick={() => router.push('/venues/new')}
          >
            Add New Venue
          </Button>
        </div>
      </div>
    </ProgressiveCard>
  )
} 
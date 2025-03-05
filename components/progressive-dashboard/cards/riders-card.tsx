"use client"

import React from 'react'
import { ProgressiveCard } from '../utils/progressive-card'
import { useData } from '../utils/data-provider'
import { FileText, Clipboard, Download, ArrowUpRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

export const RidersCard: React.FC = () => {
  const { riders, isLoading } = useData()
  const router = useRouter()
  
  const isEmpty = riders.length === 0 && !isLoading
  
  const emptyStateContent = (
    <div className="text-center p-4">
      <FileText className="h-12 w-12 text-indigo-500/50 mx-auto mb-2" />
      <h3 className="text-lg font-medium">No riders created</h3>
      <p className="text-sm text-gray-400">Create technical and hospitality riders for your performances</p>
    </div>
  )
  
  // Get rider type badge color
  const getRiderTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'technical':
        return 'bg-blue-600 text-white'
      case 'hospitality':
        return 'bg-purple-600 text-white'
      case 'backline':
        return 'bg-green-600 text-white'
      case 'production':
        return 'bg-red-600 text-white'
      default:
        return 'bg-gray-600 text-white'
    }
  }
  
  return (
    <ProgressiveCard
      title="Riders"
      icon={<FileText className="h-5 w-5" />}
      color="[#775DD0]"
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyState={emptyStateContent}
      actionButton={
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs border-indigo-500/30 text-indigo-400 hover:bg-indigo-950/30"
          onClick={() => router.push('/riders')}
        >
          View All
        </Button>
      }
    >
      <div className="space-y-3 p-2">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-400">Your Riders</h4>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/20 flex items-center gap-1"
            onClick={() => router.push('/riders/new')}
          >
            <Plus className="h-3 w-3" />
            <span>Create</span>
          </Button>
        </div>
        
        {riders.slice(0, 4).map((rider, index) => (
          <div 
            key={rider.id || index} 
            className="p-3 bg-gray-800/50 rounded-md border border-gray-700 hover:border-indigo-500/30 transition-colors cursor-pointer"
            onClick={() => router.push(`/riders/${rider.id}`)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-white font-medium">{rider.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${getRiderTypeColor(rider.type)}`}>
                    {rider.type || 'General'}
                  </span>
                  
                  {rider.updatedAt && (
                    <span className="text-xs text-gray-400">
                      Updated {format(new Date(rider.updatedAt), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/20"
                onClick={(e) => {
                  e.stopPropagation()
                  // In a real implementation, this would download the rider
                  console.log(`Downloading rider ${rider.id}`)
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            
            {rider.description && (
              <div className="mt-2 text-xs text-gray-400 line-clamp-2">
                {rider.description}
              </div>
            )}
            
            {/* Requirements preview */}
            {rider.requirements && rider.requirements.length > 0 && (
              <div className="mt-3 space-y-1">
                <h4 className="text-xs font-medium text-gray-300">Key Requirements:</h4>
                {rider.requirements.slice(0, 2).map((req: any, reqIndex: number) => (
                  <div key={reqIndex} className="flex items-start space-x-2 text-xs">
                    <Clipboard className="h-3 w-3 text-indigo-400 mt-0.5" />
                    <span className="text-gray-300">{req.text}</span>
                  </div>
                ))}
                
                {rider.requirements.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{rider.requirements.length - 2} more requirements
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-3 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/20 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/riders/${rider.id}`)
                }}
              >
                <span>View Details</span>
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {riders.length > 4 && (
          <div className="text-center text-sm text-gray-400 pt-2">
            +{riders.length - 4} more riders
          </div>
        )}
      </div>
    </ProgressiveCard>
  )
} 
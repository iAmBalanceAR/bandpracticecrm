"use client"

import React from 'react'
import { ProgressiveCard } from '../utils/progressive-card'
import { useData } from '../utils/data-provider'
import { ListMusic, Music, Clock, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export const SetListsCard: React.FC = () => {
  const { setLists, isLoading } = useData()
  const router = useRouter()
  
  const isEmpty = setLists.length === 0 && !isLoading
  
  const emptyStateContent = (
    <div className="text-center p-4">
      <ListMusic className="h-12 w-12 text-green-500/50 mx-auto mb-2" />
      <h3 className="text-lg font-medium">No set lists created</h3>
      <p className="text-sm text-gray-400">Create set lists to organize your performances</p>
    </div>
  )
  
  // Calculate total duration of a set list
  const calculateDuration = (songs: any[]) => {
    if (!songs || !songs.length) return '0 min'
    
    const totalSeconds = songs.reduce((total, song) => {
      const duration = song.duration || '0:00'
      const [minutes, seconds] = duration.split(':').map(Number)
      return total + (minutes * 60) + (seconds || 0)
    }, 0)
    
    const minutes = Math.floor(totalSeconds / 60)
    return `${minutes} min`
  }
  
  return (
    <ProgressiveCard
      title="Set Lists"
      icon={<ListMusic className="h-5 w-5" />}
      color="[#00E396]"
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyState={emptyStateContent}
      actionButton={
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs border-green-500/30 text-green-400 hover:bg-green-950/30"
          onClick={() => router.push('/set-lists')}
        >
          View All
        </Button>
      }
    >
      <div className="space-y-3 p-2">
        {setLists.slice(0, 3).map((setList, index) => (
          <div 
            key={setList.id || index} 
            className="p-3 bg-gray-800/50 rounded-md border border-gray-700 hover:border-green-500/30 transition-colors cursor-pointer"
            onClick={() => router.push(`/set-lists/${setList.id}`)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-white font-medium">{setList.name}</h3>
                <p className="text-xs text-gray-400">
                  {setList.description || `Set for ${setList.venue || 'upcoming gig'}`}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                  {setList.songs?.length || 0} songs
                </span>
                
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {calculateDuration(setList.songs)}
                </span>
              </div>
            </div>
            
            {/* Song preview */}
            {setList.songs && setList.songs.length > 0 && (
              <div className="mt-3 space-y-1">
                {setList.songs.slice(0, 3).map((song: any, songIndex: number) => (
                  <div key={songIndex} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">{songIndex + 1}.</span>
                      <Music className="h-3 w-3 text-green-500" />
                      <span className="text-white">{song.title}</span>
                    </div>
                    <span className="text-gray-500">{song.duration || '0:00'}</span>
                  </div>
                ))}
                
                {setList.songs.length > 3 && (
                  <div className="text-xs text-gray-500 pt-1">
                    +{setList.songs.length - 3} more songs
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-3 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-green-400 hover:text-green-300 hover:bg-green-950/20 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/set-lists/${setList.id}`)
                }}
              >
                <span>View Set</span>
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {setLists.length > 3 && (
          <div className="text-center text-sm text-gray-400 pt-2">
            +{setLists.length - 3} more set lists
          </div>
        )}
        
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-green-500/30 text-green-400 hover:bg-green-950/30"
            onClick={() => router.push('/set-lists/new')}
          >
            Create New Set List
          </Button>
        </div>
      </div>
    </ProgressiveCard>
  )
} 
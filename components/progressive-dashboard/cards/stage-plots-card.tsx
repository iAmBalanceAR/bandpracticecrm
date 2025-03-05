"use client"

import React from 'react'
import { ProgressiveCard } from '../utils/progressive-card'
import { useData } from '../utils/data-provider'
import { LayoutPanelTop, Download, ArrowUpRight, Plus, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

export const StagePlotsCard: React.FC = () => {
  const { stagePlots, isLoading } = useData()
  const router = useRouter()
  
  // Ensure we have sample data for demonstration if none exists
  const displayPlots = React.useMemo(() => {
    if (stagePlots.length > 0) return stagePlots
    
    // Sample data for demonstration
    return [
      {
        id: 'sample-1',
        name: 'Standard 5-Piece Setup',
        description: 'Our standard stage setup for a 5-piece band',
        imageUrl: '/images/stage-plot-sample-1.jpg',
        size: '24ft x 16ft',
        updatedAt: new Date().toISOString(),
        createdBy: 'Band Leader'
      },
      {
        id: 'sample-2',
        name: 'Acoustic Trio Setup',
        description: 'Minimal setup for acoustic performances',
        imageUrl: '/images/stage-plot-sample-2.jpg',
        size: '16ft x 12ft',
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'Sound Engineer'
      }
    ]
  }, [stagePlots])
  
  const isEmpty = stagePlots.length === 0 && !isLoading
  
  const emptyStateContent = (
    <div className="text-center p-4">
      <LayoutPanelTop className="h-12 w-12 text-cyan-500/50 mx-auto mb-2" />
      <h3 className="text-lg font-medium">No stage plots created</h3>
      <p className="text-sm text-gray-400">Create stage plots to communicate your setup needs</p>
    </div>
  )
  
  return (
    <ProgressiveCard
      title="Stage Plots"
      icon={<LayoutPanelTop className="h-5 w-5" />}
      color="[#00B8D9]"
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyState={emptyStateContent}
      className="h-full min-h-[400px]"
      actionButton={
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/30"
          onClick={() => router.push('/stage-plots')}
        >
          View All
        </Button>
      }
    >
      <div className="space-y-3 p-2 h-[calc(100%-2rem)]">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-400">Your Stage Plots</h4>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/20 flex items-center gap-1"
            onClick={() => router.push('/stage-plots/new')}
          >
            <Plus className="h-3 w-3" />
            <span>Create</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {displayPlots.slice(0, 4).map((plot, index) => (
            <div 
              key={plot.id || index} 
              className="p-3 bg-gray-800/50 rounded-md border border-gray-700 hover:border-cyan-500/30 transition-colors cursor-pointer"
              onClick={() => router.push(`/stage-plots/${plot.id}`)}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-white font-medium text-sm">{plot.name}</h3>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    // In a real implementation, this would download the stage plot
                    console.log(`Downloading stage plot ${plot.id}`)
                  }}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Stage plot preview */}
              <div className="mt-2 relative aspect-video bg-gray-900 rounded-sm border border-gray-700 flex items-center justify-center">
                {plot.imageUrl ? (
                  <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${plot.imageUrl})` }} />
                ) : (
                  <div className="text-xs text-gray-500 flex flex-col items-center">
                    <LayoutPanelTop className="h-6 w-6 text-cyan-500/30 mb-1" />
                    <span>Stage Plot</span>
                  </div>
                )}
                
                <div className="absolute inset-0 hover:bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs bg-gray-800/80 text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/stage-plots/${plot.id}`)
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    <span>Preview</span>
                  </Button>
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  {plot.updatedAt ? format(new Date(plot.updatedAt), 'MMM d, yyyy') : 'No date'}
                </span>
                
                <span className="text-gray-400">
                  {plot.size || 'Standard'}
                </span>
              </div>
              
              {plot.description && (
                <div className="mt-1 text-xs text-gray-400 line-clamp-2">
                  {plot.description}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {displayPlots.length > 4 && (
          <div className="text-center text-sm text-gray-400 pt-2">
            +{displayPlots.length - 4} more stage plots
          </div>
        )}
        
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/30"
            onClick={() => router.push('/stage-plots/new')}
          >
            Create New Stage Plot
          </Button>
        </div>
      </div>
    </ProgressiveCard>
  )
} 
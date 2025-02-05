"use client"

import React, { useState, useEffect, useRef } from 'react'
import CustomCard from '@/components/common/CustomCard'
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { Guitar, Loader2, ExternalLink, ArrowUpRight } from "lucide-react"
import StageGrid from '@/app/stage-plot/components/stage-grid'
import { listStagePlots, getStagePlot } from '@/app/stage-plot/utils/db'
import type { StagePlot, StagePlotItem } from '@/app/stage-plot/types'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/components/providers/supabase-client-provider'
import Link from 'next/link'

interface StagePlotWithItems extends StagePlot {
  items: StagePlotItem[]
}

export default function StagePlotCard() {
  const [plots, setPlots] = useState<StagePlotWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null)
  const [selectedPlotData, setSelectedPlotData] = useState<StagePlotWithItems | null>(null)
  const [visibleRecords, setVisibleRecords] = useState(5)
  const tableRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { supabase } = useSupabase()

  // Calculate dimensions based on 16:9 ratio
  const cardHeight = 430 // Same as analytics card
  const plotHeight = cardHeight - 40 // Account for padding
  const plotWidth = Math.floor((plotHeight * 16) / 9)
  const tableWidth = `calc(100% - ${plotWidth}px - 1rem)` // Full width minus plot width and gap

  useEffect(() => {
    // Calculate number of visible records based on available height
    const calculateVisibleRecords = () => {
      if (!tableRef.current) return

      const headerHeight = 40 // Approximate height of the header row
      const rowHeight = 48 // Approximate height of each data row
      const availableHeight = plotHeight - headerHeight
      const maxRecords = Math.floor(availableHeight / rowHeight)
      setVisibleRecords(maxRecords)
    }

    calculateVisibleRecords()
    // Add resize listener to recalculate on window resize
    window.addEventListener('resize', calculateVisibleRecords)
    return () => window.removeEventListener('resize', calculateVisibleRecords)
  }, [plotHeight])

  const loadPlots = async () => {
    if (!isAuthenticated) return
    
    setIsLoading(true)
    try {
      const { data: plotList, error: plotError } = await supabase
        .from('stage_plots')
        .select(`
          id,
          name,
          created_at,
          updated_at,
          user_id,
          stage_width,
          stage_depth,
          stage_plot_items (
            id,
            stage_plot_id,
            equipment_id,
            position_x,
            position_y,
            width,
            height,
            rotation,
            technical_requirements,
            customLabel,
            showLabel,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
      
      if (plotError) throw plotError

      const plotsWithItems = plotList?.map(plot => ({
        id: plot.id,
        name: plot.name,
        created_at: plot.created_at,
        updated_at: plot.updated_at,
        user_id: plot.user_id,
        stage_width: plot.stage_width || 800,
        stage_depth: plot.stage_depth || 600,
        items: plot.stage_plot_items?.map(item => ({
          id: item.id,
          stage_plot_id: item.stage_plot_id,
          equipment_id: item.equipment_id,
          position_x: item.position_x || 0,
          position_y: item.position_y || 0,
          width: item.width || 50,
          height: item.height || 50,
          rotation: item.rotation || 0,
          technical_requirements: item.technical_requirements || {},
          customLabel: item.customLabel || '',
          showLabel: item.showLabel ?? true,
          created_at: item.created_at
        })) || []
      })) || []
      
      setPlots(plotsWithItems)
      
      // Select the most recent plot by default
      if (plotsWithItems.length > 0) {
        const mostRecent = plotsWithItems[0]
        setSelectedPlot(mostRecent.id)
        setSelectedPlotData(mostRecent)
      }
    } catch (error) {
      console.error('Error loading plots:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadPlots()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const handlePlotSelect = async (plot: StagePlotWithItems) => {
    if (!isAuthenticated) return
    setSelectedPlot(plot.id)
    setSelectedPlotData(plot)
  }

  // Empty handlers for StageGrid props since this is view-only
  const noopHandler = () => {}

  return (
    <CustomCard title="Stage Plot Overview" cardColor="[#ff9920]">
      <div className="h-[430px] p-4 flex gap-4">
        {authLoading ? (
          <div className="w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-sm text-gray-400">Loading...</span>
            </div>
          </div>
        ) : !isAuthenticated ? (
          <div className="w-full flex items-center justify-center text-gray-400">
            <p>Please sign in to view stage plots</p>
          </div>
        ) : isLoading ? (
          <div className="w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-sm text-gray-400">Loading stage plots...</span>
            </div>
          </div>
        ) : plots.length === 0 ? (
          <div className="w-full  align-center text-gray-400">
            <Guitar className="w-24 h-24 mx-auto mb-4 text-[#ff9920] mt-20" />
            <p className="align-center text-center">No Stage Plots in the Database.</p>
          </div>

        ) : (
          <>
            {/* Data Table */}
            <div 
              ref={tableRef}
              style={{ width: tableWidth, height: plotHeight }} 
              className="border-2 border-solid border-gray-500 rounded-lg"
            >
              <Table>
                <TableHeader>

                  <TableRow className="bg-[#1F2937] text-gray-100">
                    <TableHead>Plot Title</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plots.slice(0, visibleRecords).map((plot) => (
                    <TableRow 
                      key={plot.id} 
                      className={`bg-[#111827] border-gray-500  cursor-pointer hover:bg-[#1F2937] transition-colors
                        ${selectedPlot === plot.id ? 'bg-[#1F2937]' : ''}`}
                      onClick={() => handlePlotSelect(plot)}
                    >
                      <TableCell className="font-medium text-gray-400">{plot.name}</TableCell>
                      <TableCell className="text-gray-400">
                        {new Date(plot.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-gray-400">{plot.items.length} Items</TableCell>
                      <TableCell className="text-gray-400 p-0">
                        <Link 
                          href="/stage-plot"
                          className="flex items-center justify-center p-2 hover:text-[#ff9920] transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Open ${plot.name} stage plot`}
                        >
                          <ExternalLink className="h-5 w-5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Plot Viewer */}
            <div 
              style={{ width: plotWidth, height: plotHeight }} 
              className="border border-gray-500 rounded-lg bg-[#111827] overflow-hidden"
            >
              {selectedPlotData && (
                <StageGrid 
                  items={selectedPlotData.items}
                  selectedItem={null}
                  onSelectItem={noopHandler}
                  onPositionChange={noopHandler}
                  onSizeChange={noopHandler}
                  onRotationChange={noopHandler}
                  onDeleteItem={noopHandler}
                />
              )}
            </div>
          </>
        )}
      </div>
    </CustomCard>
  )
} 
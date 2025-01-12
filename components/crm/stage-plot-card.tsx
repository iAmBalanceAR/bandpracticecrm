"use client"

import React, { useState, useEffect, useRef } from 'react'
import CustomCard from '@/components/common/CustomCard'
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import StageGrid from '@/app/stage-plot/components/stage-grid'
import { listStagePlots, getStagePlot } from '@/app/stage-plot/utils/db'
import type { StagePlot, StagePlotItem } from '@/app/stage-plot/types'

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
    setIsLoading(true)
    try {
      const plotList = await listStagePlots()
      const plotsWithItems = await Promise.all(
        plotList.map(async (plot) => {
          const { items } = await getStagePlot(plot.id)
          return { ...plot, items }
        })
      )
      setPlots(plotsWithItems)
      
      // Select the most recent plot by default
      if (plotsWithItems.length > 0) {
        const mostRecent = plotsWithItems.reduce((latest, current) => 
          new Date(current.created_at) > new Date(latest.created_at) ? current : latest
        )
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
    loadPlots()
  }, [])

  const handlePlotSelect = async (plot: StagePlotWithItems) => {
    setSelectedPlot(plot.id)
    setSelectedPlotData(plot)
  }

  // Empty handlers for StageGrid props since this is view-only
  const noopHandler = () => {}

  return (
    <CustomCard title="Stage Plot Overview" cardColor="[#ff9920]">
      <div className="h-[430px] p-4 flex gap-4">
        {isLoading ? (
          <div className="w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-sm text-gray-400">Loading stage plots...</span>
            </div>
          </div>
        ) : plots.length === 0 ? (
          <div className="w-full flex items-center justify-center text-gray-400">
            <p>No stage plots found</p>
          </div>
        ) : (
          <>
            {/* Data Table */}
            <div 
              ref={tableRef}
              style={{ width: tableWidth, height: plotHeight }} 
              className="border border-gray-500 rounded-lg"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1F2937] text-gray-100">
                    <TableHead>Plot Title</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead>Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plots.slice(0, visibleRecords).map((plot) => (
                    <TableRow 
                      key={plot.id} 
                      className={`bg-[#111827] border-gray-500 cursor-pointer hover:bg-[#1F2937] transition-colors
                        ${selectedPlot === plot.id ? 'bg-[#1F2937]' : ''}`}
                      onClick={() => handlePlotSelect(plot)}
                    >
                      <TableCell className="font-medium text-gray-400">{plot.name}</TableCell>
                      <TableCell className="text-gray-400">
                        {new Date(plot.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-gray-400">{plot.items.length} Items</TableCell>
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
"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import CustomSectionHeader from "@/components/common/CustomSectionHeader"
import { Plus, FileDown, Edit, Trash, Loader2 } from "lucide-react"
import { FeedbackModal } from "@/components/ui/feedback-modal"
import StagePlotEditor from './components/stage-plot-editor'
import { listStagePlots, deleteStagePlot, getStagePlot } from './utils/db'
import { generateStagePlotPDF } from './utils/export'
import type { StagePlot, StagePlotItem } from './types'

interface StagePlotWithItems extends StagePlot {
  items: StagePlotItem[]
}

export default function StagePlotPage() {
  const [plots, setPlots] = useState<StagePlotWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null)
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'delete'
    onConfirm?: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  })

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
    } catch (error) {
      console.error('Error loading plots:', error)
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load stage plots',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPlots()
  }, [])

  const handleDelete = async (id: string) => {
    setFeedbackModal({
      isOpen: true,
      title: 'Delete Stage Plot',
      message: 'Are you sure you want to delete this stage plot? This action cannot be undone.',
      type: 'delete',
      onConfirm: async () => {
        const success = await deleteStagePlot(id)
        if (success) {
          await loadPlots()
          setFeedbackModal({
            isOpen: true,
            title: 'Success',
            message: 'Stage plot deleted successfully',
            type: 'success'
          })
        } else {
          setFeedbackModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete stage plot',
            type: 'error'
          })
        }
      }
    })
  }

  return (
    <CustomSectionHeader title="Stage Plot Generator" underlineColor="#0f1729">
      <Card className="bg-[#111C44] min-h-[500px] border-none p-0 m-0">
        <CardHeader className="pb-4 mb-2">
          <CardTitle className="flex justify-between items-center text-3xl font-bold">
            <div className="flex flex-auto tracking-tight text-3xl">
              <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-white text-shadow-sm font-mono font-normal text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                Stage Plot Generator
              </span>
            </div>
            {!isCreating && !selectedPlot && (
              <Button onClick={() => setIsCreating(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus size={20} />
                Create New Plot
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {isCreating ? (
            <div className="space-y-4">
              <div className="flex justify-end mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreating(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white border-none"
                >
                  Back to List
                </Button>
              </div>
              <StagePlotEditor 
                onSaved={() => {
                  setIsCreating(false)
                  loadPlots()
                }}
              />
            </div>
          ) : selectedPlot ? (
            <div className="space-y-4">
              <div className="flex justify-end mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedPlot(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white border-none"
                >
                  Back to List
                </Button>
              </div>
              <StagePlotEditor 
                plotId={selectedPlot}
                onSaved={() => {
                  setSelectedPlot(null)
                  loadPlots()
                }}
              />
            </div>
          ) : (
            <div className="relative min-h-[400px]">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#111C44]/50">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-400">Loading stage plots...</span>
                  </div>
                </div>
              ) : plots.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <p className="text-lg mb-4">No stage plots found</p>
                  <Button 
                    onClick={() => setIsCreating(true)}
                    className="gap-2"
                  >
                    <Plus size={16} />
                    Create your first stage plot
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Band Members</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plots.map((plot) => (
                      <TableRow key={plot.id}>
                        <TableCell className="font-medium">{plot.name}</TableCell>
                        <TableCell>{new Date(plot.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{plot.items.length} members</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setSelectedPlot(plot.id)}
                              title="Edit"
                            >
                              <Edit size={18} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(plot.id)}
                              title="Delete"
                            >
                              <Trash size={18} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
      />
    </CustomSectionHeader>
  )
} 
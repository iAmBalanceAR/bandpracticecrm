"use client"
import React, { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FeedbackModal } from "@/components/ui/feedback-modal"
import { StagePlot, StagePlotItem, Position, Size } from '../types'
import { getEquipmentByCategory, CATEGORY_LABELS, createNewStageItem } from '../utils/equipment'
import StageGrid from './stage-grid'
import TechnicalRequirements from './technical-requirements'
import { createStagePlot, updateStagePlotItems, updateStagePlot, getStagePlot } from '../utils/db'
import { generateStagePlotPDF } from '../utils/export'
import { Loader2, FileDown } from "lucide-react"

interface StagePlotEditorProps {
  plotId?: string
  onSaved?: () => void
}

export default function StagePlotEditor({ plotId, onSaved }: StagePlotEditorProps) {
  const [plotName, setPlotName] = useState<string>('')
  const [items, setItems] = useState<StagePlotItem[]>([])
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(!!plotId)
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
  const [selectedEquipment, setSelectedEquipment] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)
  const [saveType, setSaveType] = useState<'continue' | 'exit' | null>(null)

  const equipmentByCategory = getEquipmentByCategory()

  useEffect(() => {
    if (plotId) {
      loadPlot()
    }
  }, [plotId])

  const loadPlot = async () => {
    if (!plotId) return

    try {
      const { plot, items: plotItems } = await getStagePlot(plotId)
      if (!plot) {
        throw new Error('Stage plot not found')
      }

      setPlotName(plot.name)
      setItems(plotItems)
    } catch (error) {
      console.error('Error loading stage plot:', error)
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load stage plot',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = () => {
    if (!selectedEquipment) return

    const newItem = createNewStageItem(selectedEquipment)
    if (!newItem) return

    setItems([...items, newItem])
    setSelectedEquipment('')
  }

  const handlePositionChange = (id: string, position: Position) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, position_x: position.x, position_y: position.y }
        : item
    ))
  }

  const handleSizeChange = (id: string, size: Size) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, width: size.width, height: size.height }
        : item
    ))
  }

  const handleRotationChange = (id: string, rotation: number) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, rotation }
        : item
    ))
  }

  const handleLabelChange = (id: string, label: string) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, customLabel: label }
        : item
    ))
  }

  const handleShowLabelChange = (id: string, showLabel: boolean) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, showLabel }
        : item
    ))
  }

  const handleDeleteItem = (id: string) => {
    setFeedbackModal({
      isOpen: true,
      title: 'Delete Item',
      message: 'Are you sure you want to remove this item from the stage plot?',
      type: 'delete',
      onConfirm: () => {
        setItems(items.filter(item => item.id !== id))
        setSelectedItem(null)
      }
    })
  }

  const handleTechRequirementsChange = (id: string, requirements: Record<string, string[]>) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, technical_requirements: requirements }
        : item
    ))
  }

  const handleSave = async (shouldExit: boolean = true) => {
    if (!plotName) {
      setFeedbackModal({
        isOpen: true,
        title: 'Missing Information',
        message: 'Please enter a name for the stage plot',
        type: 'error'
      })
      return
    }

    if (items.length === 0) {
      setFeedbackModal({
        isOpen: true,
        title: 'Missing Information',
        message: 'Please add at least one item to the stage plot',
        type: 'error'
      })
      return
    }

    setSaveType(shouldExit ? 'exit' : 'continue')
    setIsSaving(true)

    try {
      if (plotId) {
        // Update existing plot
        const plotSuccess = await updateStagePlot(plotId, {
          name: plotName,
          stage_width: 1600,
          stage_depth: 900
        })

        if (!plotSuccess) {
          throw new Error('Failed to update stage plot')
        }

        const itemsSuccess = await updateStagePlotItems(
          plotId,
          items.map(item => ({
            ...item,
            stage_plot_id: plotId
          }))
        )

        if (!itemsSuccess) {
          throw new Error('Failed to update stage plot items')
        }
      } else {
        // Create new plot
        const plot = await createStagePlot(
          plotName,
          1600,
          900,
          items.map(({ id, stage_plot_id, created_at, ...item }) => item)
        )

        if (!plot) {
          throw new Error('Failed to create stage plot')
        }
      }

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: plotId ? 'Stage plot updated successfully' : 'Stage plot saved successfully',
        type: 'success'
      })

      if (shouldExit) {
        onSaved?.()
      }
    } catch (error) {
      console.error('Error saving stage plot:', error)
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to save stage plot',
        type: 'error'
      })
    } finally {
      setIsSaving(false)
      setSaveType(null)
    }
  }

  const handleCancel = () => {
    if (items.length > 0) {
      setFeedbackModal({
        isOpen: true,
        title: 'Warning',
        message: 'You have unsaved changes. Are you sure you want to cancel?',
        type: 'warning',
        onConfirm: () => onSaved?.()
      })
    } else {
      onSaved?.()
    }
  }

  const handleExport = async () => {
    if (!plotName || items.length === 0) {
      setFeedbackModal({
        isOpen: true,
        title: 'Cannot Export',
        message: 'Please ensure you have a plot name and at least one item before exporting.',
        type: 'error'
      })
      return
    }

    setIsExporting(true)
    try {
      const plot: StagePlot = {
        id: plotId || crypto.randomUUID(),
        user_id: '', // Will be set by the server
        name: plotName,
        stage_width: 1600,
        stage_depth: 900,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await generateStagePlotPDF(plot, items, {
        includeGrid: true,
        includeTechRequirements: true
      })
    } catch (error) {
      console.error('Error exporting stage plot:', error)
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to export stage plot',
        type: 'error'
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Label htmlFor="plot-name">Plot Name</Label>
          <Input
            id="plot-name"
            value={plotName}
            onChange={(e) => setPlotName(e.target.value)}
            placeholder="Enter plot name..."
          />
        </div>
        <div className="flex-1">
          <Label>Add Equipment</Label>
          <div className="flex gap-2">
            <Select value={selectedEquipment} onValueChange={setSelectedEquipment} >
              <SelectTrigger>
                <SelectValue placeholder="Select equipment..." />
              </SelectTrigger>
              <SelectContent className="bg-[#111C44] text-white ">
                {Object.entries(equipmentByCategory).map(([category, items]) => (
                  <SelectGroup key={category}>
                    <SelectLabel className="font-mono font-normal text-lg text-[#ff9920] px-0 pb-0 pl-1.5 border-b border-[#ff9920]/50 m-0">
                      {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                    </SelectLabel>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="cursor-pointer  focus:bg-[#030817] p-2 focus:font-semibold">
                       {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAddItem}
              disabled={!selectedEquipment}
              className="bg-blue-700 text-white text-shadow-x-2 text-shadow-y-2 text-shadow-black  border-black border cursor-pointer"
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="w-full">
          <StageGrid
            items={items}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onPositionChange={handlePositionChange}
            onSizeChange={handleSizeChange}
            onRotationChange={handleRotationChange}
            onDeleteItem={handleDeleteItem}
            onLabelChange={handleLabelChange}
          />
        </div>
        <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting || items.length === 0}
          className="gap-2 bg-blue-700 text-white text-shadow-x-2 text-shadow-y-2 text-shadow-black  border-black border cursor-pointer"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          Export PDF
        </Button>
        {plotId && (
          <Button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="gap-2 bg-green-700 text-white text-shadow-x-2 text-shadow-y-2 text-shadow-black  border-black border cursor-pointer"
          >
            {isSaving && saveType === 'continue' && <Loader2 className="h-4 w-4 animate-spin" />}
            Save and Continue
          </Button>
        )}
        <Button
          onClick={() => handleSave(true)}
          disabled={isSaving}
          className="gap-2 bg-green-700 text-white text-shadow-x-2 text-shadow-y-2 text-shadow-black  border-black border cursor-pointer"
        >
          {isSaving && saveType === 'exit' && <Loader2 className="h-4 w-4 animate-spin" />}
          {plotId ? 'Save and Exit' : 'Save Plot'}
        </Button>
      </div>
        <div className="w-full">
          <TechnicalRequirements
            items={items}
            selectedItem={selectedItem}
            onRequirementsChange={handleTechRequirementsChange}
            onLabelChange={handleLabelChange}
            onShowLabelChange={handleShowLabelChange}
          />
        </div>
      </div>

      

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        onConfirm={feedbackModal.onConfirm}
      />
    </div>
  )
} 
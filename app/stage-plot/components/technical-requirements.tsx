"use client"
import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { StagePlotItem } from '../types'
import { getEquipmentById } from '../utils/equipment'

interface TechnicalRequirementsProps {
  items: StagePlotItem[]
  selectedItem: string | null
  onRequirementsChange: (id: string, requirements: Record<string, string[]>) => void
  onLabelChange?: (id: string, label: string) => void
  onShowLabelChange?: (id: string, showLabel: boolean) => void
}

const REQUIREMENT_CATEGORIES = [
  { key: 'inputs', label: 'Audio Inputs' },
  { key: 'microphones', label: 'Microphones' },
  { key: 'monitors', label: 'Monitors' },
  { key: 'power_requirements', label: 'Power Requirements' },
  { key: 'other', label: 'Other Requirements' }
] as const;

export default function TechnicalRequirements({
  items,
  selectedItem,
  onRequirementsChange,
  onLabelChange,
  onShowLabelChange
}: TechnicalRequirementsProps) {
  const selectedItemData = selectedItem ? items.find(item => item.id === selectedItem) : null
  const equipment = selectedItemData ? getEquipmentById(selectedItemData.equipment_id) : null

  const handleAddRequirement = (category: string) => {
    if (!selectedItemData) return

    const currentRequirements = selectedItemData.technical_requirements[category] || []
    onRequirementsChange(selectedItemData.id, {
      ...selectedItemData.technical_requirements,
      [category]: [...currentRequirements, '']
    })
  }

  const handleUpdateRequirement = (
    category: string,
    index: number,
    value: string
  ) => {
    if (!selectedItemData) return

    const currentRequirements = selectedItemData.technical_requirements[category] || []
    const updatedRequirements = [...currentRequirements]
    updatedRequirements[index] = value
    onRequirementsChange(selectedItemData.id, {
      ...selectedItemData.technical_requirements,
      [category]: updatedRequirements
    })
  }

  const handleRemoveRequirement = (
    category: string,
    index: number
  ) => {
    if (!selectedItemData) return

    const currentRequirements = selectedItemData.technical_requirements[category] || []
    onRequirementsChange(selectedItemData.id, {
      ...selectedItemData.technical_requirements,
      [category]: currentRequirements.filter((_, i) => i !== index)
    })
  }

  if (!selectedItemData || !equipment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Technical Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Select an item on the stage to view and edit its technical requirements.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-3">
        <div className="space-y-4">
          <div className="space-y-2">
            <CardTitle>Title</CardTitle>
            <Input
              value={selectedItemData.customLabel || equipment.label}
              onChange={(e) => onLabelChange?.(selectedItemData.id, e.target.value)}
              placeholder="Enter title..."
            />
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="showLabel"
                checked={selectedItemData.showLabel !== false}
                onChange={(e) => 
                  onShowLabelChange?.(selectedItemData.id, e.target.checked)
                }
              />
              <Label 
                htmlFor="showLabel"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Show label on stage grid
              </Label>
            </div>
          </div>
          <CardTitle>Technical Requirements</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-6">
        {REQUIREMENT_CATEGORIES.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{label}</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddRequirement(key)}
              >
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {(selectedItemData.technical_requirements[key] || []).map((req, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={req}
                    onChange={(e) => handleUpdateRequirement(key, index, e.target.value)}
                    placeholder={`Enter ${label.toLowerCase()}`}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveRequirement(key, index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 
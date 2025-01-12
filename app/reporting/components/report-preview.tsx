"use client"

import { ReportSection } from '../types'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, X } from 'lucide-react'
import { SectionPreview } from './section-preview'

interface ReportPreviewProps {
  sections: ReportSection[];
  selectedSection: string | null;
  onReorder: (startIndex: number, endIndex: number) => void;
  onRemove: (sectionId: string) => void;
  onSelect: (sectionId: string | null) => void;
}

export function ReportPreview({ 
  sections,
  selectedSection,
  onReorder,
  onRemove,
  onSelect
}: ReportPreviewProps) {
  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
        <p className="mb-2">No sections added yet</p>
        <p className="text-sm">Add sections from the left sidebar to build your report</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <Card
          key={section.id}
          className={`p-4 cursor-pointer transition-colors ${
            selectedSection === section.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onSelect(section.id)}
        >
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="cursor-grab active:cursor-grabbing"
              // TODO: Implement drag and drop
            >
              <GripVertical className="w-4 h-4" />
            </Button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-medium">{section.title}</h4>
                  {section.description && (
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(section.id)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="relative">
                <SectionPreview section={section} />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
} 
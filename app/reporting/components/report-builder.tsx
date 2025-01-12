"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ReportSection, ReportTemplate, ReportSectionOptions } from "../types"
import { SectionPreview } from "./section-preview"
import { useToast } from "@/components/ui/use-toast"
import { Plus, FileDown, Minus, Check } from "lucide-react"

const DEFAULT_SECTION_OPTIONS: ReportSectionOptions = {
  showTitle: true,
  layout: 'list',
  filters: []
}

const AVAILABLE_SECTIONS: ReportSection[] = [
  { 
    id: "financial", 
    type: "financial", 
    title: "Financial Summary",
    options: DEFAULT_SECTION_OPTIONS
  },
  { 
    id: "schedule", 
    type: "schedule", 
    title: "Tour Schedule",
    options: DEFAULT_SECTION_OPTIONS
  },
  { 
    id: "venue", 
    type: "venue", 
    title: "Venue Details",
    options: DEFAULT_SECTION_OPTIONS
  },
  { 
    id: "leads", 
    type: "leads", 
    title: "Leads Overview",
    options: DEFAULT_SECTION_OPTIONS
  },
  { 
    id: "technical", 
    type: "technical", 
    title: "Technical Requirements",
    options: DEFAULT_SECTION_OPTIONS
  },
  { 
    id: "map", 
    type: "map", 
    title: "Route Map",
    options: DEFAULT_SECTION_OPTIONS
  },
  { 
    id: "stage-plot", 
    type: "stage-plot", 
    title: "Stage Plot",
    options: DEFAULT_SECTION_OPTIONS
  },
  { 
    id: "contacts", 
    type: "contacts", 
    title: "Contact Information",
    options: DEFAULT_SECTION_OPTIONS
  },
  { 
    id: "custom", 
    type: "custom", 
    title: "Custom Section",
    options: DEFAULT_SECTION_OPTIONS
  }
]

export function ReportBuilder() {
  const { toast } = useToast()
  const [template, setTemplate] = useState<ReportTemplate>({
    id: "",
    name: "",
    sections: [],
    layout: 'single',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const handleAddSection = (section: ReportSection) => {
    setTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, { ...section, id: crypto.randomUUID() }]
    }))
  }

  const handleRemoveSection = (sectionId: string) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }))
  }

  const handleGenerateReport = async () => {
    try {
      // TODO: Implement PDF generation
      toast({
        title: "Generating Report",
        description: "Your report will download shortly"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      })
    }
  }

  const toggleSection = (section: ReportSection) => {
    const existingSection = template.sections.find(s => s.type === section.type)
    if (existingSection) {
      handleRemoveSection(existingSection.id)
    } else {
      handleAddSection(section)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#192555] border-blue-500">
          <div className="p-4">
            <Label htmlFor="name">Report Name</Label>
            <Input
              id="name"
              value={template.name}
              onChange={e => setTemplate(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter report name..."
              className="mt-2 border-blue-500"
            />
          </div>
        </Card>
        
        <Card className="bg-[#192555] border-blue-500">
          <div className="p-4">
            <div className="text-sm text-muted-foreground">Total Sections</div>
            <div className="text-2xl font-bold mt-1">{template.sections.length}</div>
          </div>
        </Card>

        <div className="lg:col-start-4">
          <Button 
            onClick={handleGenerateReport} 
            className="w-full border-blue-500"
            disabled={template.sections.length === 0}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="border-b border-blue-500 pb-2 mb-4">
            <h3 className="text-lg font-medium">Available Sections</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVAILABLE_SECTIONS.map(section => {
              const isSelected = template.sections.some(s => s.type === section.type)
              return (
                <Card 
                  key={section.id} 
                  className={`bg-[#192555] border-blue-500 ${
                    isSelected ? 'border-green-500 border-2 bg-green-500/5' : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <div className="bg-green-500 p-1.5 rounded-full shadow-lg">
                            <Check className="w-5 h-5 text-white stroke-[3]" />
                          </div>
                        )}
                        <h3 className="font-medium">{section.title}</h3>
                      </div>
                      <Button
                        size="icon"
                        onClick={() => toggleSection(section)}
                        className={`${isSelected ? 'border-green-500 hover:bg-red-500/10' : 'border-blue-500 hover:bg-green-500/10'}`}
                      >
                        {isSelected ? (
                          <Minus className="w-4 h-4 text-red-500" />
                        ) : (
                          <Plus className="w-4 h-4 text-green-500" />
                        )}
                      </Button>
                    </div>
                    <SectionPreview section={section} />
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        <div>
          <div className="border-b border-blue-500 pb-2 mb-4">
            <h3 className="text-lg font-medium">Report Preview</h3>
          </div>
          {template.sections.length === 0 ? (
            <Card className="bg-[#192555] border-blue-500">
              <div className="p-4 text-center text-muted-foreground">
                No sections added yet. Add some sections to preview your report.
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {template.sections.map((section, index) => (
                <Card key={section.id} className="bg-[#192555] border-blue-500">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium">{section.title}</h3>
                        <p className="text-sm text-muted-foreground">Section {index + 1}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSection(section.id)}
                        className="border-blue-500"
                      >
                        Remove
                      </Button>
                    </div>
                    <SectionPreview section={section} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
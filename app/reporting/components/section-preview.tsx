"use client"

import { ReportSection } from "../types"

interface SectionPreviewProps {
  section: ReportSection
}

export function SectionPreview({ section }: SectionPreviewProps) {
  return renderPreview()

  function renderPreview() {
    const PreviewWrapper = ({ children }: { children: React.ReactNode }) => (
      <div>
        {children}
      </div>
    )

    switch (section.type) {
      case "financial":
        return (
          <PreviewWrapper>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-blue-500 rounded p-2">
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-xl font-bold">$0.00</div>
              </div>
              <div className="border border-blue-500 rounded p-2">
                <div className="text-sm text-muted-foreground">Expenses</div>
                <div className="text-xl font-bold">$0.00</div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="h-24 w-24 border border-blue-500 rounded flex items-center justify-center">
                Chart
              </div>
            </div>
          </PreviewWrapper>
        )
      case "schedule":
        return (
          <PreviewWrapper>
            <div className="text-sm font-medium">Schedule Preview</div>
            <div className="space-y-2">
              <div className="flex justify-between border border-blue-500 rounded p-2">
                <div>Venue 1</div>
                <div>Date 1</div>
              </div>
              <div className="flex justify-between border border-blue-500 rounded p-2">
                <div>Venue 2</div>
                <div>Date 2</div>
              </div>
            </div>
          </PreviewWrapper>
        )
      case "venue":
        return (
          <PreviewWrapper>
            <div className="text-sm font-medium">Venue Details Preview</div>
            <div className="border border-blue-500 rounded p-2">
              <div>Sample Venue</div>
              <div className="text-sm text-muted-foreground">123 Main St, City, State</div>
              <div className="text-sm text-muted-foreground">Capacity: 500</div>
            </div>
          </PreviewWrapper>
        )
      case "leads":
        return (
          <PreviewWrapper>
            <div className="text-sm font-medium">Leads Preview</div>
            <div className="space-y-2">
              <div className="border border-blue-500 rounded p-2">
                <div>Lead 1</div>
                <div className="text-sm text-muted-foreground">Status: Open</div>
              </div>
              <div className="border border-blue-500 rounded p-2">
                <div>Lead 2</div>
                <div className="text-sm text-muted-foreground">Status: Open</div>
              </div>
            </div>
          </PreviewWrapper>
        )
      case "technical":
        return (
          <PreviewWrapper>
            <div className="text-sm font-medium">Technical Requirements Preview</div>
            <div className="border border-blue-500 rounded p-2">
              <ul className="list-disc list-inside space-y-1">
                <li>Stage dimensions</li>
                <li>Power requirements</li>
                <li>Equipment list</li>
              </ul>
            </div>
          </PreviewWrapper>
        )
      case "map":
        return (
          <PreviewWrapper>
            <div className="text-sm font-medium">Route Map Preview</div>
            <div className="h-24 border border-blue-500 rounded flex items-center justify-center">
              Map
            </div>
          </PreviewWrapper>
        )
      case "stage-plot":
        return (
          <PreviewWrapper>
            <div className="text-sm font-medium">Stage Plot Preview</div>
            <div className="h-24 border border-blue-500 rounded flex items-center justify-center">
              Stage Plot
            </div>
          </PreviewWrapper>
        )
      case "contacts":
        return (
          <PreviewWrapper>
            <div className="text-sm font-medium">Contact Information Preview</div>
            <div className="border border-blue-500 rounded p-2">
              <div>Contact Name</div>
              <div className="text-sm text-muted-foreground">Role: Manager</div>
              <div className="text-sm text-muted-foreground">Phone: (555) 555-5555</div>
            </div>
          </PreviewWrapper>
        )
      case "custom":
        return (
          <PreviewWrapper>
            <div className="text-sm font-medium">Custom Section Preview</div>
            <div className="border border-blue-500 rounded p-2">
              Custom content will be displayed here
            </div>
          </PreviewWrapper>
        )
      default:
        return null
    }
  }
} 
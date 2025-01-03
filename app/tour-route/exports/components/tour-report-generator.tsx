"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ReportPreview } from '@/app/tour-route/exports/components/report-preview'
import { useTour } from '@/components/providers/tour-provider'
import { Loader2 } from 'lucide-react'
import { generateTourReport, generatePDF } from '@/app/tour-route/exports/utils/report-generator'
import html2canvas from 'html2canvas'
import { FeedbackModal } from "@/components/ui/feedback-modal"

interface ReportOptions {
  includeMap: boolean;
  includeDirections: boolean;
  includeFinancials: boolean;
  includeContactInfo: boolean;
}

export function TourReportGenerator() {
  const { currentTour, isLoading } = useTour()
  const [isGenerating, setIsGenerating] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  })
  const [options, setOptions] = useState<ReportOptions>({
    includeMap: true,
    includeDirections: true,
    includeFinancials: false,
    includeContactInfo: true,
  })
  const [previewData, setPreviewData] = useState<any>(null)

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      if (!currentTour?.id) {
        throw new Error('No tour selected')
      }
      const data = await generateTourReport(currentTour.id, options)
      setPreviewData(data)
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!previewData) return
    try {
      // Capture the map if it's included in options
      if (options.includeMap) {
        const mapElement = document.getElementById('tour-route-map')
        if (mapElement) {
          const canvas = await html2canvas(mapElement)
          previewData.mapImageUrl = canvas.toDataURL('image/png')
        }
      }
      await generatePDF(previewData)
      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: 'Tour report has been generated and downloaded successfully!',
        type: 'success'
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to generate PDF. Please try again.',
        type: 'error'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!currentTour) {
    return (
      <div className="text-center text-gray-400 py-8">
        Please select a tour to generate a report.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6 bg-[#1B2559] border-none">
          <h3 className="text-xl font-semibold mb-4 text-white">Report Options</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeMap"
                checked={options.includeMap}
                onChange={(e) => 
                  setOptions(prev => ({ ...prev, includeMap: e.target.checked }))
                }
              />
              <Label htmlFor="includeMap">Include Tour Route Map</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeDirections"
                checked={options.includeDirections}
                onChange={(e) => 
                  setOptions(prev => ({ ...prev, includeDirections: e.target.checked }))
                }
              />
              <Label htmlFor="includeDirections">Include Driving Directions</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeFinancials"
                checked={options.includeFinancials}
                onChange={(e) => 
                  setOptions(prev => ({ ...prev, includeFinancials: e.target.checked }))
                }
              />
              <Label htmlFor="includeFinancials">Include Financial Summary</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeContactInfo"
                checked={options.includeContactInfo}
                onChange={(e) => 
                  setOptions(prev => ({ ...prev, includeContactInfo: e.target.checked }))
                }
              />
              <Label htmlFor="includeContactInfo">Include Venue Contact Information</Label>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Report...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
            {previewData && (
              <Button
                onClick={handleDownloadPDF}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Download PDF
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-[#1B2559] border-none">
          <h3 className="text-xl font-semibold mb-4 text-white">Tour Information</h3>
          <div className="space-y-2 text-gray-300">
            <p><span className="font-semibold">Tour Name:</span> {currentTour.title}</p>
            <p><span className="font-semibold">Start Date:</span> {currentTour.start_date}</p>
            <p><span className="font-semibold">End Date:</span> {currentTour.end_date}</p>
            {/* Add more tour details as needed */}
          </div>
        </Card>
      </div>

      {previewData && (
        <Card className="p-6 bg-[#1B2559] border-none">
          <ReportPreview data={previewData} />
        </Card>
      )}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
      />
    </div>
  )
} 
"use client"
import React, { useEffect, useState } from 'react'

interface ReportLoadingOverlayProps {
  onComplete: () => Promise<void>
}

const steps = [
  'Loading tour data...',
  'Calculating route distances...',
  'Processing venue information...',
  'Generating financial summary...',
  'Creating preview...'
]

export default function ReportLoadingOverlay({ onComplete }: ReportLoadingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const stepDuration = 600 // Duration for each step in ms
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(interval)
          setTimeout(() => {
            onComplete()
          }, 500) // Small delay before completing
          return prev
        }
        return prev + 1
      })
    }, stepDuration)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1B2559] rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">
            Generating Report Preview...
          </h3>
          
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={step}
                className="flex items-center space-x-3"
              >
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center
                  transition-colors duration-200
                  ${index <= currentStep ? 'bg-blue-500' : 'bg-gray-700'}
                `}>
                  {index < currentStep ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : index === currentStep ? (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  ) : null}
                </div>
                <span className={`
                  text-sm transition-colors duration-200
                  ${index <= currentStep ? 'text-gray-200' : 'text-gray-500'}
                `}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-200"
              style={{
                width: `${(currentStep + 1) * (100 / steps.length)}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 
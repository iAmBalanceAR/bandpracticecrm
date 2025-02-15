"use client"
import React, { useEffect, useState } from 'react'

interface RiderPDFLoadingOverlayProps {
  onComplete: () => void
  hasGig?: boolean
  hasInputList?: boolean
  hasStagePlot?: boolean
  hasSetlist?: boolean
  isCompleted?: boolean
}

interface StepFlags {
  hasGig?: boolean
  hasInputList?: boolean
  hasStagePlot?: boolean
  hasSetlist?: boolean
}

const getSteps = (props: StepFlags) => {
  const steps = ['Preparing rider content...']
  
  if (props.hasGig) {
    steps.push('Adding gig details...')
  }
  
  if (props.hasInputList) {
    steps.push('Generating input list...')
  }
  
  if (props.hasStagePlot) {
    steps.push('Creating stage plot...')
    steps.push('Adding technical requirements...')
  }
  
  if (props.hasSetlist) {
    steps.push('Including setlist...')
  }
  
  steps.push('Finalizing PDF...')
  return steps
}

export default function RiderPDFLoadingOverlay({ 
  onComplete,
  hasGig = false,
  hasInputList = false,
  hasStagePlot = false,
  hasSetlist = false,
  isCompleted = false
}: RiderPDFLoadingOverlayProps) {
  const steps = getSteps({ hasGig, hasInputList, hasStagePlot, hasSetlist })
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (isCompleted) {
      setCurrentStep(steps.length - 1)
      return
    }

    const stepDuration = 900 // Duration for each step in ms
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, stepDuration)

    return () => clearInterval(interval)
  }, [steps.length, isCompleted])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {isCompleted ? 'PDF Generated Successfully!' : 'Generating Rider PDF...'}
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
                  ${index <= currentStep ? 'bg-green-500' : 'bg-gray-200'}
                `}>
                  {index < currentStep || isCompleted ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : index === currentStep ? (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  ) : null}
                </div>
                <span className={`
                  text-sm transition-colors duration-200
                  ${index <= currentStep ? 'text-gray-900' : 'text-gray-400'}
                `}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-200"
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
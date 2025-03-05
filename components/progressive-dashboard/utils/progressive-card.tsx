"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ProgressiveCardProps {
  title: string
  icon?: React.ReactNode
  color: string
  className?: string
  isLoading?: boolean
  isEmpty?: boolean
  emptyState?: React.ReactNode
  children: React.ReactNode
  onboardingStep?: number
  actionButton?: React.ReactNode
}

export const ProgressiveCard: React.FC<ProgressiveCardProps> = ({
  title,
  icon,
  color,
  className,
  isLoading = false,
  isEmpty = false,
  emptyState,
  children,
  onboardingStep,
  actionButton
}) => {
  // Determine text color based on background color
  const textColor = `text-${color}`
  
  return (
    <div className={cn(
      "bg-gray-900/80 border border-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col",
      className
    )}>
      {/* Card Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-gray-800",
        `bg-${color}/5`
      )}>
        <div className="flex items-center gap-2">
          {icon && (
            <div className={cn("text-" + color)}>
              {icon}
            </div>
          )}
          <h2 className={cn(
            "font-semibold text-white",
            onboardingStep !== undefined && "flex items-center gap-2"
          )}>
            {title}
            {onboardingStep !== undefined && (
              <span className={cn(
                "inline-flex items-center justify-center w-5 h-5 text-xs rounded-full",
                `bg-${color} text-black`
              )}>
                {onboardingStep}
              </span>
            )}
          </h2>
        </div>
        
        {actionButton && (
          <div>
            {actionButton}
          </div>
        )}
      </div>
      
      {/* Card Content */}
      <div className="flex-grow relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className={cn("h-8 w-8 animate-spin", `text-${color}`)} />
              <p className="text-sm text-gray-400">Loading...</p>
            </div>
          </div>
        ) : isEmpty && emptyState ? (
          <div className="h-full flex items-center justify-center">
            {emptyState}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
} 
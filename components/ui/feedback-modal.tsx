"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from "./dialog"
import { Button } from "./button"
import { Check, AlertTriangle, X } from "lucide-react"

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'delete'
  onConfirm?: () => void
  className?: string
}

export function FeedbackModal({
  isOpen,
  onClose,
  title,
  message,
  type,
  onConfirm,
  className
}: FeedbackModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="rounded-full bg-green-500/20 p-3">
            <Check className="h-8 w-8 text-green-500" />
          </div>
        )
      case 'warning':
      case 'delete':
      case 'error':
        return (
          <div className="rounded-full bg-red-500/20 p-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        )
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <style jsx global>{`
        .leaflet-pane {
          z-index: 1 !important;
        }
        .leaflet-top,
        .leaflet-bottom {
          z-index: 2 !important;
        }
      `}</style>
      <DialogPortal>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm -z-50">
        <DialogContent className="fixed left-[50%] top-[50%] z-0 translate-x-[-50%] translate-y-[-50%] max-w-[400px] bg-[#0B1437] rounded-2xl border border-blue-900/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex flex-col items-center text-center space-y-3">
            {getIcon()}
            
            <h2 className="text-xl font-semibold text-white">
              {title}
            </h2>
            
            <p className="text-gray-400">
              {message}
            </p>

            {(type === 'delete' || type === 'warning') && onConfirm ? (
              <div className="flex space-x-3">
                <Button 
                  onClick={handleConfirm}
                  className={`${type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} min-w-[100px] text-white`}
                >
                  {type === 'delete' ? 'Delete' : 'Continue'}
                </Button>
                <Button 
                  onClick={onClose} 
                  className="bg-gray-600 hover:bg-gray-700 min-w-[100px] text-white"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button 
                onClick={onClose} 
                className={`mt-4 min-w-[100px] text-white ${
                  type === 'success' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {type === 'success' ? 'Close' : 'Okay'}
              </Button>
            )}
          </div>
        </DialogContent>
        </div>
      </DialogPortal>
    </Dialog>
  )
} 
"use client"

import * as React from "react"
import { Dialog, DialogContent } from "./dialog"
import { Button } from "./button"
import { Check, AlertTriangle, X} from "lucide-react"

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type: 'success' | 'error' | 'delete'
  onConfirm?: () => void
}

export function FeedbackModal({
  isOpen,
  onClose,
  title,
  message,
  type,
  onConfirm
}: FeedbackModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="rounded-full bg-green-500/20 p-3">
            <Check className="h-8 w-8 text-green-500" />
          </div>
        )
      case 'delete':
      case 'error':
        return (
          <div className="rounded-full bg-red-500/20 p-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent className="relative max-w-[400px] bg-[#0B1437] rounded-2xl border border-blue-900/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] p-6">
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

          {type === 'delete' ? (
            <div className="flex space-x-3">
              <Button 
                onClick={onConfirm} 
                className="bg-red-600 hover:bg-red-700 min-w-[100px] text-white"
              >
                Delete
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
    </Dialog>
  )
} 
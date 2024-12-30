'use client'

import React from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'delete'
  onConfirm?: () => void
}

export function FeedbackModal({ isOpen, onClose, title, message, type = 'success', onConfirm }: FeedbackModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />
      case 'warning':
      case 'delete':
        return <AlertCircle className="h-6 w-6 text-yellow-500" />
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent className="bg-[#111c44] text-white border border-green-600/50 p-6">
        <div className="flex items-start space-x-4">
          {getIcon()}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-gray-300">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          {type === 'delete' ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-600 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700"
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 
"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface CustomDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function CustomDialog({ isOpen, onClose, title, children }: CustomDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
} 
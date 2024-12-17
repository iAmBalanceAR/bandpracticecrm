"use client"

import React, { createContext, useContext, useState } from 'react'
import { CustomDialog } from '@/components/ui/custom-dialog'

interface DialogContextType {
  showDialog: (props: DialogProps) => void
  hideDialog: () => void
}

interface DialogProps {
  title: string
  message: string
}

const DialogContext = createContext<DialogContextType>({
  showDialog: () => {},
  hideDialog: () => {},
})

export function useDialog() {
  return useContext(DialogContext)
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogProps, setDialogProps] = useState<DialogProps | null>(null)

  const showDialog = (props: DialogProps) => {
    setDialogProps(props)
  }

  const hideDialog = () => {
    setDialogProps(null)
  }

  return (
    <DialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      <CustomDialog
        isOpen={!!dialogProps}
        onClose={hideDialog}
        title={dialogProps?.title}
      >
        {dialogProps?.message && (
          <div className="py-4 text-gray-200 whitespace-pre-line">
            {dialogProps.message}
          </div>
        )}
      </CustomDialog>
    </DialogContext.Provider>
  )
} 
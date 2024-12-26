import { useState } from 'react'

interface DeleteConfirmationState {
  isOpen: boolean
  title: string
  message: string
  itemToDelete: string | null
  onConfirm?: () => void
}

const defaultState: DeleteConfirmationState = {
  isOpen: false,
  title: '',
  message: '',
  itemToDelete: null
}

export function useDeleteConfirmation() {
  const [state, setState] = useState<DeleteConfirmationState>(defaultState)

  const showDeleteConfirmation = (
    itemId: string,
    options?: {
      title?: string
      message?: string
      onConfirm?: () => void
    }
  ) => {
    setState({
      isOpen: true,
      title: options?.title || 'Confirm Delete',
      message: options?.message || 'Are you sure you want to delete this item? This action cannot be undone.',
      itemToDelete: itemId,
      onConfirm: options?.onConfirm
    })
  }

  const hideDeleteConfirmation = () => {
    setState(defaultState)
  }

  const confirmDelete = async () => {
    if (state.onConfirm) {
      await state.onConfirm()
    }
    hideDeleteConfirmation()
  }

  return {
    deleteConfirmation: {
      ...state,
      onClose: hideDeleteConfirmation,
      onConfirm: confirmDelete
    },
    showDeleteConfirmation,
    hideDeleteConfirmation
  }
} 
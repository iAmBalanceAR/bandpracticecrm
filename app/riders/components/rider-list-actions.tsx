"use client"

import { useRouter } from 'next/navigation'
import { RiderListProps } from '../types'
import { deleteRider } from '../actions'
import { toast } from 'sonner'
import { RiderList } from './rider-list'
import { useState } from 'react'
import { FeedbackModal } from '@/components/ui/feedback-modal'
import { Loader2 } from 'lucide-react'

export function RiderListActions(props: RiderListProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'delete' | 'warning';
    onConfirm?: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  const handleSelect = (rider: any) => {
    router.push(`/riders/${rider.type}/edit/${rider.id}`)
  }

  const handleViewDetails = (rider: any) => {
    router.push(`/riders/${rider.type}/details/${rider.id}`)
  }

  const handleDelete = async (rider: any): Promise<void> => {
    setFeedbackModal({
      isOpen: true,
      title: 'Delete Rider',
      message: 'Are you sure you want to delete this rider? This action cannot be undone.',
      type: 'delete',
      onConfirm: async () => {
        setIsDeleting(true)
        try {
          const result = await deleteRider(rider.id);
          if (!result.success) throw new Error('Failed to delete rider');
          setFeedbackModal({ 
            isOpen: true, 
            title: 'Success', 
            message: 'Rider deleted successfully', 
            type: 'success' 
          });
          router.refresh();
        } catch (error) {
          console.error('Error deleting rider:', error);
          setFeedbackModal({ 
            isOpen: true, 
            title: 'Error', 
            message: 'Failed to delete rider', 
            type: 'error' 
          });
        } finally {
          setIsDeleting(false)
        }
      }
    });
  }

  return (
    <>
      <RiderList
        {...props}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
      />
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        onConfirm={async () => {
          if (feedbackModal.onConfirm) {
            await feedbackModal.onConfirm();
          }
        }}
      />
    </>
  )
} 
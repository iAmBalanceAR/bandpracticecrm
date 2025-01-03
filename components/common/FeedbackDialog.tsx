'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  type: 'success' | 'error';
}

export function FeedbackDialog({
  open,
  onOpenChange,
  title,
  message,
  type,
}: FeedbackDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-[#192555] border-blue-800 text-white p-6 shadow-lg rounded-lg">
          <div className="flex items-center gap-3">
            {type === 'success' ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            <Dialog.Title className="text-xl font-bold">{title}</Dialog.Title>
          </div>
          <Dialog.Description className="mt-2 text-gray-400">
            {message}
          </Dialog.Description>
          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <Button
                variant="outline"
                className="bg-transparent border-blue-800 hover:bg-blue-800/20"
              >
                Close
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 
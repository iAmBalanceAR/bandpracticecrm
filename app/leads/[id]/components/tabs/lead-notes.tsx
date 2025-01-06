'use client';

import { useState } from 'react';
import { Lead, LeadNote } from '@/app/types/lead';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import createClient from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { FeedbackModal } from '@/components/ui/feedback-modal';

interface LeadNotesProps {
  lead: Lead & {
    lead_notes: Partial<LeadNote>[];
  };
}

type FeedbackModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'delete';
  onConfirm?: () => Promise<void>;
};

export default function LeadNotes({ lead }: LeadNotesProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No session found');
      }

      const { data, error } = await supabase
        .rpc('create_lead_note', {
          note_data: {
            lead_id: lead.id,
            content: formData.get('content')
          }
        });

      if (error) throw error;

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: 'Note added successfully',
        type: 'success'
      });
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error adding note:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to add note',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    setFeedbackModal({
      isOpen: true,
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note?',
      type: 'delete',
      onConfirm: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            throw new Error('No session found');
          }

          const { error } = await supabase
            .rpc('delete_lead_note', {
              note_id: noteId
            });

          if (error) throw error;

          setFeedbackModal({
            isOpen: true,
            title: 'Success',
            message: 'Note deleted successfully',
            type: 'success'
          });
          router.refresh();
        } catch (error) {
          console.error('Error deleting note:', error);
          setFeedbackModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete note',
            type: 'error'
          });
        }
      }
    });
  };

  return (
    <div className="relative">
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">New Note</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Add a note..."
              required
              className="min-h-[100px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div></div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          {!lead.lead_notes?.length ? (
            <p className="text-center text-muted-foreground py-4">
              No notes yet. Add your first note above.
            </p>
          ) : (
            lead.lead_notes
              .sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
              })
              .map((note) => (
                <div
                  key={note.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {note.created_at && formatDistanceToNow(new Date(note.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px] bg-[#111C44]">
                        <DropdownMenuItem
                          onClick={() => handleDelete(note.id)}
                          className="text-red-600 cursor-pointer"
                        >
                          Delete Note
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="whitespace-pre-wrap">{note.content}</p>
                </div>
              ))
          )}
        </div>
      </CardContent>

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        onConfirm={feedbackModal.onConfirm}
      />
    </div>
  );
} 
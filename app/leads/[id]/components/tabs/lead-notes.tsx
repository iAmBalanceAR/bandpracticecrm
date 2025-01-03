'use client';

import { useState } from 'react';
import { Lead, LeadNote } from '@/app/types/lead';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { MoreVertical, Lock, Unlock } from 'lucide-react';

interface LeadNotesProps {
  lead: Lead & {
    lead_notes: LeadNote[];
  };
}

export default function LeadNotes({ lead }: LeadNotesProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      lead_id: lead.id,
      content: formData.get('content') as string,
      is_private: isPrivate,
    };

    try {
      const { error } = await supabase
        .from('lead_notes')
        .insert([data]);

      if (error) throw error;

      toast.success('Note added successfully');
      router.refresh();
      (e.target as HTMLFormElement).reset();
      setIsPrivate(false);
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this note?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('lead_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast.success('Note deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  return (
    <>
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
            <div className="flex items-center space-x-2">
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Label htmlFor="private" className="text-sm">
                Make note private
              </Label>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          {lead.lead_notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No notes yet. Add your first note above.
            </p>
          ) : (
            lead.lead_notes
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((note) => (
                <div
                  key={note.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(note.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      {note.is_private && (
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Lock className="h-3 w-3" />
                          <span>Private</span>
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDelete(note.id)}
                          className="text-red-600"
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
    </>
  );
} 
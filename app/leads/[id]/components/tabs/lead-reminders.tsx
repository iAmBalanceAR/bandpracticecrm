'use client';

import { useState } from 'react';
import { Lead, LeadReminder } from '@/app/types/lead';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format, formatDistanceToNow } from 'date-fns';
import { useSupabase } from '@/components/providers/supabase-client-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FeedbackModal } from '@/components/ui/feedback-modal';
import { Trash2, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface LeadRemindersProps {
  lead: Lead & {
    reminders: LeadReminder[];
  };
  onUpdate?: () => void;
}

type FeedbackModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'delete';
  onConfirm?: () => Promise<void>;
};

export default function LeadReminders({ lead, onUpdate }: LeadRemindersProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dueDate, setDueDate] = useState<Date>();
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });
  const router = useRouter();
  const { supabase } = useSupabase();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('No authenticated user found');
      }

      if (!dueDate) {
        throw new Error('Due date is required');
      }

      const { data, error } = await supabase
        .rpc('create_reminder', {
          reminder_data: {
            lead_id: lead.id,
            title: formData.get('title'),
            description: formData.get('description'),
            due_date: dueDate.toISOString(),
            completed: false
          }
        });

      if (error) throw error;

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: 'Reminder added successfully',
        type: 'success'
      });
      (e.target as HTMLFormElement).reset();
      setDueDate(undefined);
      onUpdate?.();
    } catch (error) {
      console.error('Error adding reminder:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to add reminder',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (reminderId: string) => {
    setFeedbackModal({
      isOpen: true,
      title: 'Delete Reminder',
      message: 'Are you sure you want to delete this reminder?',
      type: 'delete',
      onConfirm: async () => {
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            throw new Error('No authenticated user found');
          }

          const { error } = await supabase
            .rpc('delete_reminder', {
              reminder_id: reminderId
            });

          if (error) throw error;

          setFeedbackModal({
            isOpen: true,
            title: 'Success',
            message: 'Reminder deleted successfully',
            type: 'success'
          });
          onUpdate?.();
        } catch (error) {
          console.error('Error deleting reminder:', error);
          setFeedbackModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete reminder',
            type: 'error'
          });
        }
      }
    });
  };

  const toggleReminderStatus = async (reminder: LeadReminder) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('No authenticated user found');
      }

      const { error } = await supabase
        .rpc('update_reminder', {
          reminder_id: reminder.id,
          reminder_data: {
            completed: !reminder.completed
          }
        });

      if (error) throw error;

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: 'Reminder status updated',
        type: 'success'
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating reminder:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update reminder',
        type: 'error'
      });
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Reminders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex gap-2">
              <div className="flex flex-auto gap-2">
                <Label htmlFor="title">Title</Label>
              </div>
              <div className='flex flex-1'>
                <Label>Date</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid-col-1 gap-2">
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter reminder title"
                  required
                  className="w-full bg-[#1B2559]"
                />
              </div>
              <div className="grid-col-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#111C44]">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Add reminder details..."
              required
              className="min-h-[100px] bg-[#1B2559]"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Reminder'}
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          {lead.reminders.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No reminders yet. Add your first reminder above.
            </p>
          ) : (
            lead.reminders
              .sort((a, b) => {
                const dateA = new Date(a.due_date).getTime();
                const dateB = new Date(b.due_date).getTime();
                return dateA - dateB;
              })
              .map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={reminder.completed}
                          onChange={() => toggleReminderStatus(reminder)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className={cn(
                          "font-medium",
                          reminder.completed && "line-through text-muted-foreground"
                        )}>
                          {reminder.title}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          Due {formatDistanceToNow(new Date(reminder.due_date), {
                            addSuffix: true,
                          })}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => reminder.id && handleDelete(reminder.id)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {reminder.description}
                    </p>
                  </div>
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
    </>
  );
} 
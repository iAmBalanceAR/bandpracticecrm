'use client';

import { useState, useEffect } from 'react';
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
import { MoreVertical, CalendarIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface LeadRemindersProps {
  lead: Lead & {
    reminders: LeadReminder[];
  };
}

type FeedbackModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'delete';
  onConfirm?: () => Promise<void>;
};

export default function LeadReminders({ lead }: LeadRemindersProps) {
  const [reminders, setReminders] = useState<LeadReminder[]>(lead.reminders || []);
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

  // Subscribe to realtime changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('lead_reminders_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'reminders',
          filter: `lead_id=eq.${lead.id}`
        }, 
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            setReminders(prev => [payload.new as LeadReminder, ...prev]);
          } else if (payload.eventType === 'DELETE' && payload.old.id) {
            setReminders(prev => prev.filter(reminder => reminder.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE' && payload.new.id) {
            setReminders(prev => prev.map(reminder => 
              reminder.id === payload.new.id ? (payload.new as LeadReminder) : reminder
            ));
          }
        }
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.error('Failed to subscribe to reminders changes:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, lead.id, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No session found');
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
      router.refresh();
      (e.target as HTMLFormElement).reset();
      setDueDate(undefined);
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
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            throw new Error('No session found');
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
          router.refresh();
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No session found');
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
      router.refresh();
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
            <div className=" grid-col-1  gap-2">
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter reminder title"
                  required
                  className="w-full bg-[#1B2559] "
                />
              </div>
              <div className="grid-col-1r">
                <Popover className="w-full">
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-[#1B2559]"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto  p-0 bg-[#0f1729] border-[#4A5568]">
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select name="priority" defaultValue="medium">
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Reminder'}
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          {reminders.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No reminders yet. Add your first reminder above.
            </p>
          ) : (
            reminders
              .sort((a, b) => {
                const dateA = new Date(a.due_date).getTime();
                const dateB = new Date(b.due_date).getTime();
                return dateA - dateB;
              })
              .map((reminder) => (
                <div
                  key={reminder.id}
                  className={cn(
                    "flex gap-4 p-4 border rounded-lg",
                    reminder.completed && "opacity-50"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium capitalize">
                        {reminder.title}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(reminder.due_date), "MMM d, yyyy")}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[200px] bg-[#111C44]">
                            <DropdownMenuItem
                              onClick={() => toggleReminderStatus(reminder)}
                              className={cn(
                                "cursor-pointer",
                                reminder.completed ? 'text-green-600' : 'text-blue-600'
                              )}
                            >
                              {reminder.completed ? 'Mark as Pending' : 'Mark as Complete'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(reminder.id)}
                              className="text-red-600 cursor-pointer"
                            >
                              Delete Reminder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-muted-foreground">
                      {reminder.description}
                    </p>
                    {reminder.completed && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Created by {reminder.created_by_email}
                      </p>
                    )}
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
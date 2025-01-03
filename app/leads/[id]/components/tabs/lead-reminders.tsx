'use client';

import { useState } from 'react';
import { Lead, Reminder } from '@/app/types/lead';
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
import createClient from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FeedbackModal } from '@/components/ui/feedback-modal';

interface LeadRemindersProps {
  lead: Lead & {
    reminders: Reminder[];
  };
}

type FeedbackModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'delete';
};

export default function LeadReminders({ lead }: LeadRemindersProps) {
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
      const { data, error } = await supabase
        .from('reminders')
        .insert([
          {
            lead_id: lead.id,
            title: formData.get('title'),
            description: formData.get('description'),
            due_date: formData.get('due_date'),
            priority: formData.get('priority') || 'medium',
            status: 'pending'
          }
        ])
        .select();

      if (error) throw error;

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: 'Reminder added successfully',
        type: 'success'
      });
      router.refresh();
      (e.target as HTMLFormElement).reset();
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

  const toggleReminderStatus = async (reminder: Reminder) => {
    try {
      const newStatus = reminder.status === 'pending' ? 'completed' : 'pending';
      const { error } = await supabase
        .from('reminders')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', reminder.id);

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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter reminder title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                type="datetime-local"
                id="due_date"
                name="due_date"
                required
              />
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
                  className={cn(
                    "flex gap-4 p-4 border rounded-lg cursor-pointer transition-colors",
                    reminder.status === 'completed' && "opacity-50"
                  )}
                  onClick={() => toggleReminderStatus(reminder)}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            reminder.priority === 'high' && "bg-red-500",
                            reminder.priority === 'medium' && "bg-yellow-500",
                            reminder.priority === 'low' && "bg-green-500"
                          )}
                        />
                        {reminder.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(reminder.due_date), "MMM d, yyyy h:mm a")}
                      </div>
                    </div>
                    <p className="text-muted-foreground">
                      {reminder.description}
                    </p>
                    {reminder.status === 'completed' && reminder.completed_at && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Completed {formatDistanceToNow(new Date(reminder.completed_at), { addSuffix: true })}
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
      />
    </>
  );
} 
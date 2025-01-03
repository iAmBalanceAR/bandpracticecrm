'use client';

import { useState } from 'react';
import { Lead, Reminder, LeadPriority } from '@/app/types/lead';
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
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadRemindersProps {
  lead: Lead & {
    reminders: Reminder[];
  };
}

const priorityColors: Record<LeadPriority, string> = {
  low: 'text-blue-500',
  medium: 'text-yellow-500',
  high: 'text-red-500'
};

export default function LeadReminders({ lead }: LeadRemindersProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      lead_id: lead.id,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      due_date: new Date(formData.get('due_date') as string).toISOString(),
      priority: formData.get('priority') as LeadPriority,
      status: 'pending' as const,
    };

    try {
      const { error } = await supabase
        .from('reminders')
        .insert([data]);

      if (error) throw error;

      toast.success('Reminder added successfully');
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast.error('Failed to add reminder');
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

      toast.success('Reminder status updated');
      router.refresh();
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast.error('Failed to update reminder');
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
                placeholder="Reminder title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                name="due_date"
                type="datetime-local"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Add details about the reminder..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select name="priority" required defaultValue="medium">
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
            <>
              <div className="space-y-2">
                <h4 className="font-medium">Pending</h4>
                {lead.reminders
                  .filter(reminder => reminder.status === 'pending')
                  .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                  .map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <button
                        onClick={() => toggleReminderStatus(reminder)}
                        className="mt-1"
                      >
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{reminder.title}</h4>
                            {reminder.description && (
                              <p className="text-muted-foreground mt-1">
                                {reminder.description}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(reminder.due_date), 'PPp')}
                            </div>
                            <div className={cn(
                              'text-right mt-1 font-medium',
                              priorityColors[reminder.priority]
                            )}>
                              {reminder.priority}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Completed</h4>
                {lead.reminders
                  .filter(reminder => reminder.status === 'completed')
                  .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
                  .map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-start gap-4 p-4 border rounded-lg opacity-60"
                    >
                      <button
                        onClick={() => toggleReminderStatus(reminder)}
                        className="mt-1"
                      >
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium line-through">
                              {reminder.title}
                            </h4>
                            {reminder.description && (
                              <p className="text-muted-foreground mt-1 line-through">
                                {reminder.description}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div>Completed {formatDistanceToNow(new Date(reminder.completed_at!), { addSuffix: true })}</div>
                            <div className="text-right mt-1">Due {format(new Date(reminder.due_date), 'PP')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </>
  );
} 
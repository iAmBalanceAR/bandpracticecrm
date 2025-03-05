'use client';

import { useState, useEffect, useRef } from 'react';
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
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';

// Custom paragraph-only editor component
function ParagraphOnlyEditor({
  content,
  onChange,
  placeholder = 'Add reminder details...',
  minHeight = '100px'
}: {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
}) {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph.configure({
        HTMLAttributes: {
          class: 'mt-0 mb-1',
        },
      }),
      Text,
    ],
    content,
    editorProps: {
      attributes: {
        class: `prose prose-invert max-w-none focus:outline-none px-3 pt-1 pb-2 text-gray-200 text-base leading-relaxed w-full min-h-[${minHeight}]`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#1A2652] border-2 border-[#111C44] overflow-hidden">
      <div className="prose-lg prose-invert w-full">
        <EditorContent editor={editor} className="py-0" />
      </div>
    </div>
  );
}

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

const stripHtml = (html: string) => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export default function LeadReminders({ lead, onUpdate }: LeadRemindersProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dueDate, setDueDate] = useState<Date>();
  const [dueTime, setDueTime] = useState<string>("12:00");
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });
  const router = useRouter();
  const { supabase } = useSupabase();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Hide the toolbar after the component mounts
  useEffect(() => {
    if (editorRef.current) {
      const toolbar = editorRef.current.querySelector('.border-b');
      if (toolbar) {
        (toolbar as HTMLElement).style.display = 'none';
      }
    }
  }, []);

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

      const [hours, minutes] = dueTime.split(':').map(Number);
      const dueDateWithTime = new Date(dueDate);
      dueDateWithTime.setHours(hours, minutes);

      const { data, error } = await supabase
        .rpc('create_reminder', {
          reminder_data: {
            lead_id: lead.id,
            title: formData.get('title'),
            description: formData.get('description'),
            due_date: dueDateWithTime.toISOString(),
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
      setDueTime("12:00");
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
        <p className="text-sm text-gray-400">Enter the details of your reminder using the form below.   When reminders come due, an alert will display within your session, regardless of what page you're on,to remind you. Closing the alert marks the remminder as complete in your lead.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex gap-2">
              <div className="flex flex-auto gap-2">
                <Label htmlFor="title">Title</Label>
              </div>
              <div className='flex flex-1'>
                <Label>Due Date & Time</Label>
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
              <div className="grid-col-1 flex gap-2 text-white">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-white" />
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
                <Input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-32 bg-[#1B2559] text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-time-picker-indicator]:invert"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <ParagraphOnlyEditor
              content=""
              onChange={(content: string) => {
                const contentInput = document.createElement('input')
                contentInput.type = 'hidden'
                contentInput.name = 'description'
                contentInput.value = content
                const form = document.querySelector('form')
                const existingInput = form?.querySelector('input[name="description"]')
                if (existingInput) {
                  existingInput.remove()
                }
                form?.appendChild(contentInput)
              }}
              placeholder="Add reminder details..."
              minHeight="100px"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}
            className="bg-green-700 text-white hover:bg-green-600 border border-black"
            >
              {isLoading ? 'Adding...' : '+ Add Reminder'}
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
                  className="flex gap-4 p-4 bg-[#0A1129] border border-white/40 rounded-lg"
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
                          className="hover:bg-[#2D3748] hover:text-rose-500 hover:shadow-rose-500 hover:shadow-sm hover:font-semibold text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {reminder.description ? stripHtml(reminder.description) : ''}
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
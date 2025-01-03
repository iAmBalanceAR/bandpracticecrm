'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import createClient from '@/utils/supabase/client';
import { Lead, LeadStatus, LeadPriority, LeadType } from '@/app/types/lead';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, X, Plus, Check, Pencil, Lock } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { FeedbackModal } from '@/components/ui/feedback-modal';
import { Switch } from '@/components/ui/switch';
import { useSupabase } from '@/components/providers/supabase-client-provider';

interface NewLeadDialogProps {
  children: React.ReactNode;
}

type ReminderPriority = 'low' | 'medium' | 'high';

interface Reminder {
  title: string;
  description: string;
  due_date: Date;
  priority: ReminderPriority;
  isEditing: boolean;
}

interface Note {
  content: string;
  is_private: boolean;
  isEditing: boolean;
}

const statusOptions: LeadStatus[] = ['new', 'contacted', 'in_progress', 'negotiating', 'won', 'lost', 'archived'];
const priorityOptions: LeadPriority[] = ['low', 'medium', 'high'];
const typeOptions: LeadType[] = ['venue', 'artist', 'promoter', 'sponsor', 'other'];

export default function NewLeadDialog({ children }: NewLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'delete';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [initialNotes, setInitialNotes] = useState<Note[]>([]);
  const [initialReminders, setInitialReminders] = useState<Reminder[]>([]);
  const router = useRouter();
  const supabase = createClient();
  const { user } = useSupabase();

  const handleVenueSearch = async (value: string) => {
    setSearchValue(value);
    if (value === '') {
      setVenues([]);
      return;
    }
    if (value.length > 2) {
      try {
        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .ilike('title', `%${value}%`)
          .limit(5);
        
        if (error) throw error;
        setVenues(data || []);
      } catch (error) {
        console.error('Error searching venues:', error);
        setVenues([]);
      }
    } else {
      setVenues([]);
    }
  };

  const handleVenueSelect = (venue: any) => {
    setSelectedVenue(venue);
    setSearchValue(venue.title);
    setVenues([]); // Clear the dropdown
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert([{
          title: formData.get('title') as string,
          type: formData.get('type') as LeadType,
          status: formData.get('status') as LeadStatus,
          priority: formData.get('priority') as LeadPriority,
          company: formData.get('company') as string,
          description: formData.get('description') as string,
          venue_id: selectedVenue?.id,
          contact_info: {
            name: formData.get('contact_name') as string,
            email: formData.get('contact_email') as string,
            phone: formData.get('contact_phone') as string,
          },
          tags: [],
          last_contact_date: new Date().toISOString(),
          created_by: user?.id,
          assigned_to: user?.id,
        }])
        .select()
        .single();

      if (leadError) throw leadError;

      // Add initial notes
      if (initialNotes.length > 0) {
        const { error: notesError } = await supabase
          .from('lead_notes')
          .insert(
            initialNotes.map(note => ({
              lead_id: lead.id,
              content: note.content,
              is_private: note.is_private,
              created_by: 'user',
            }))
          );

        if (notesError) throw notesError;
      }

      // Add reminders
      if (initialReminders.length > 0) {
        const { error: remindersError } = await supabase
          .from('reminders')
          .insert(
            initialReminders.map(reminder => ({
              lead_id: lead.id,
              title: reminder.title,
              description: reminder.description,
              due_date: reminder.due_date.toISOString(),
              priority: reminder.priority,
              status: 'pending',
            }))
          );

        if (remindersError) throw remindersError;
      }

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: 'Lead created successfully',
        type: 'success'
      });
      setOpen(false);
      router.refresh();
      router.push(`/leads/${lead.id}`);
    } catch (error) {
      console.error('Error creating lead:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to create lead',
        type: 'warning'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          {children}
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-[1200px] translate-x-[-50%] translate-y-[-50%] bg-[#192555] border border-blue-800 text-white p-8 shadow-lg rounded-lg max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold mb-4">Create New Lead</Dialog.Title>
            <Dialog.Description className="text-gray-400 mt-2">
             <p> Add a new lead to your pipeline. Fill out the form below with the lead's details.</p>
            </Dialog.Description>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Column 1: Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Enter lead title"
                      required
                      className="bg-[#1B2559] border-blue-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      name="company"
                      placeholder="Enter company name"
                      className="bg-[#1B2559] border-blue-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select name="type" defaultValue="venue">
                      <SelectTrigger className="bg-[#1B2559] border border-blue-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f1729] border-[#4A5568] text-white">
                        {typeOptions.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="new">
                      <SelectTrigger className="bg-[#1B2559] border border-blue-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f1729] border-[#4A5568] text-white">
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue="medium">
                      <SelectTrigger className="bg-[#1B2559] border border-blue-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f1729] border-[#4A5568] text-white">
                        {priorityOptions.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Column 2: Contact Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      name="contact_name"
                      placeholder="Enter contact name"
                      className="bg-[#1B2559] border border-blue-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      placeholder="Enter contact email"
                      className="bg-[#1B2559] border border-blue-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      name="contact_phone"
                      placeholder="Enter contact phone"
                      className="bg-[#1B2559] border border-blue-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Venue</Label>
                    <div className="relative">
                      <Input
                        placeholder="Search venues..."
                        value={searchValue}
                        onChange={(e) => handleVenueSearch(e.target.value)}
                        className="bg-[#1B2559] border border-blue-800"
                      />
                      {venues.length > 0 && (
                        <div className="absolute w-full z-50 top-full mt-1 bg-[#1B2559] rounded-md shadow-lg max-h-[200px] overflow-y-auto border border-blue-800">
                          {venues.map((venue) => (
                            <div
                              key={venue.id}
                              onClick={() => handleVenueSelect(venue)}
                              className="cursor-pointer hover:bg-[#2a3c7d] p-2 flex justify-between items-center"
                            >
                              <span className="font-medium">{venue.title}</span>
                              <span className="text-sm text-gray-400 ml-2">• {venue.city}, {venue.state}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchValue.length > 2 && venues.length === 0 && !selectedVenue && (
                        <div className="absolute w-full z-50 top-full mt-1 bg-[#1B2559] rounded-md shadow-lg p-2 border border-blue-800">
                          No venues found
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="]">
                    <div className="space-y-2">
                      <Label htmlFor="venue_address">Venue Address</Label>
                      <Input
                        id="venue_address"
                        name="venue_address"
                        value={selectedVenue?.address || ''}
                        readOnly
                        className="bg-[#192555] border border-blue-800"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="venue_city">City</Label>
                        <Input
                          id="venue_city"
                          name="venue_city"
                          value={selectedVenue?.city || ''}
                          readOnly
                          className="bg-[#192555] border border-blue-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="venue_state">State</Label>
                        <Input
                          id="venue_state"
                          name="venue_state"
                          value={selectedVenue?.state || ''}
                          readOnly
                          className="bg-[#192555] border border-blue-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="venue_zip">ZIP</Label>
                        <Input
                          id="venue_zip"
                          name="venue_zip"
                          value={selectedVenue?.zip || ''}
                          readOnly
                          className="bg-[#192555] border border-blue-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Notes & Reminders */}
                <div className="space-y-6">
                  {/* Notes Section */}
                  <div className="space-y-4 border border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between border-b border-blue-800 pb-2">
                      <h3 className="text-lg font-semibold">Notes</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setInitialNotes([...initialNotes, { content: '', is_private: false, isEditing: true }]);
                        }}
                        className="h-8 w-8 hover:bg-[#2a3c7d]"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {initialNotes.map((note, index) => (
                        <div key={index}>
                          {note.isEditing ? (
                            <div className="space-y-2 bg-[#1B2559] rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm text-gray-400">New Note</Label>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newNotes = [...initialNotes];
                                      newNotes[index].isEditing = false;
                                      setInitialNotes(newNotes);
                                    }}
                                    className="h-6 w-6 hover:bg-[#2a3c7d]"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newNotes = [...initialNotes];
                                      newNotes.splice(index, 1);
                                      setInitialNotes(newNotes);
                                    }}
                                    className="h-6 w-6 hover:bg-[#2a3c7d]"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <Textarea
                                value={note.content}
                                onChange={(e) => {
                                  const newNotes = [...initialNotes];
                                  newNotes[index].content = e.target.value;
                                  setInitialNotes(newNotes);
                                }}
                                placeholder="Enter note content"
                                className="bg-[#192555] border border-blue-800 min-h-[100px]"
                              />
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`note-private-${index}`}
                                  checked={note.is_private}
                                  onCheckedChange={(checked: boolean) => {
                                    const newNotes = [...initialNotes];
                                    newNotes[index].is_private = checked;
                                    setInitialNotes(newNotes);
                                  }}
                                />
                                <Label htmlFor={`note-private-${index}`} className="text-sm">Private Note</Label>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-[#1B2559] rounded-lg p-2">
                              <div className="flex items-center gap-2">
                                {note.is_private && <Lock className="h-3 w-3 text-gray-400" />}
                                <span className="truncate max-w-[300px]">{note.content}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newNotes = [...initialNotes];
                                    newNotes[index].isEditing = true;
                                    setInitialNotes(newNotes);
                                  }}
                                  className="h-6 w-6 hover:bg-[#2a3c7d]"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newNotes = [...initialNotes];
                                    newNotes.splice(index, 1);
                                    setInitialNotes(newNotes);
                                  }}
                                  className="h-6 w-6 hover:bg-[#2a3c7d]"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {initialNotes.length === 0 && (
                        <div className="text-center text-gray-400 py-4">
                          No notes added yet. Click the + button to add a note.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reminders Section */}
                  <div className="space-y-4 border border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between border-b border-blue-800 pb-2">
                      <h3 className="text-lg font-semibold">Reminders</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setInitialReminders([
                            ...initialReminders,
                            {
                              title: '',
                              description: '',
                              due_date: new Date(),
                              priority: 'medium' as ReminderPriority,
                              isEditing: true
                            },
                          ]);
                        }}
                        className="h-8 w-8 hover:bg-[#2a3c7d]"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {initialReminders.map((reminder, index) => (
                        <div key={index}>
                          {reminder.isEditing ? (
                            <div className="space-y-3 bg-[#1B2559] rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm text-gray-400">New Reminder</Label>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newReminders = [...initialReminders];
                                      newReminders[index].isEditing = false;
                                      setInitialReminders(newReminders);
                                    }}
                                    className="h-6 w-6 hover:bg-[#2a3c7d]"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newReminders = [...initialReminders];
                                      newReminders.splice(index, 1);
                                      setInitialReminders(newReminders);
                                    }}
                                    className="h-6 w-6 hover:bg-[#2a3c7d]"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <Input
                                value={reminder.title}
                                onChange={(e) => {
                                  const newReminders = [...initialReminders];
                                  newReminders[index].title = e.target.value;
                                  setInitialReminders(newReminders);
                                }}
                                placeholder="Reminder title"
                                className="bg-[#192555] border border-blue-800"
                              />
                              <Textarea
                                value={reminder.description}
                                onChange={(e) => {
                                  const newReminders = [...initialReminders];
                                  newReminders[index].description = e.target.value;
                                  setInitialReminders(newReminders);
                                }}
                                placeholder="Reminder description"
                                className="bg-[#192555] border border-blue-800 min-h-[80px]"
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-sm">Due Date</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal bg-[#192555] border border-blue-800"
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(reminder.due_date, "PPP")}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#0f1729] border-[#4A5568]">
                                      <Calendar
                                        mode="single"
                                        selected={reminder.due_date}
                                        onSelect={(date) => {
                                          if (date) {
                                            const newReminders = [...initialReminders];
                                            newReminders[index].due_date = date;
                                            setInitialReminders(newReminders);
                                          }
                                        }}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm">Priority</Label>
                                  <Select
                                    value={reminder.priority}
                                    onValueChange={(value: ReminderPriority) => {
                                      const newReminders = [...initialReminders];
                                      newReminders[index].priority = value;
                                      setInitialReminders(newReminders);
                                    }}
                                  >
                                    <SelectTrigger className="bg-[#192555] border border-blue-800">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0f1729] border-[#4A5568] text-white">
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-[#1B2559] rounded-lg p-2">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  reminder.priority === 'high' && "bg-red-500",
                                  reminder.priority === 'medium' && "bg-yellow-500",
                                  reminder.priority === 'low' && "bg-green-500"
                                )} />
                                <span className="truncate max-w-[200px]">{reminder.title}</span>
                                <span className="text-sm text-gray-400">{format(reminder.due_date, "MMM d")}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newReminders = [...initialReminders];
                                    newReminders[index].isEditing = true;
                                    setInitialReminders(newReminders);
                                  }}
                                  className="h-6 w-6 hover:bg-[#2a3c7d]"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newReminders = [...initialReminders];
                                    newReminders.splice(index, 1);
                                    setInitialReminders(newReminders);
                                  }}
                                  className="h-6 w-6 hover:bg-[#2a3c7d]"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {initialReminders.length === 0 && (
                        <div className="text-center text-gray-400 py-4">
                          No reminders added yet. Click the + button to add a reminder.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter lead description"
                  className="bg-[#1B2559] border-blue-800"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Lead...
                    </>
                  ) : (
                    'Create Lead'
                  )}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

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
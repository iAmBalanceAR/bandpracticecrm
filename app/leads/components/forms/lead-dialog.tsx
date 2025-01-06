'use client';

import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { FeedbackModal } from '@/components/ui/feedback-modal';
import { useSupabase } from '@/components/providers/supabase-client-provider';

interface LeadDialogProps {
  children: React.ReactNode;
  lead?: Lead;  // Optional lead for edit mode
  mode?: 'create' | 'edit';
}

interface LeadData {
  title: string;
  type: LeadType;
  status: LeadStatus;
  priority: LeadPriority;
  company: string;
  description: string;
  venue_id?: string;
  contact_info: {
    name: string;
    email: string;
    phone: string;
  };
  tags: string[];
  last_contact_date: string;
  created_by_email: string;
}

interface LeadResponse {
  id: string;
  [key: string]: any;
}

const statusOptions: LeadStatus[] = ['new', 'contacted', 'in_progress', 'negotiating', 'won', 'lost', 'archived'];
const priorityOptions: LeadPriority[] = ['low', 'medium', 'high'];
const typeOptions: LeadType[] = ['venue', 'artist', 'promoter', 'other'];

export default function LeadDialog({ children, lead, mode = 'create' }: LeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState(lead?.venue_id ? '' : '');
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
  const router = useRouter();
  const supabase = createClient();
  const { user } = useSupabase();

  // Effect to fetch venue details if editing a lead with a venue
  useEffect(() => {
    if (lead?.venue_id) {
      const fetchVenue = async () => {
        try {
          const { data, error } = await supabase
            .from('venues')
            .select('*')
            .eq('id', lead.venue_id)
            .single();
          
          if (error) throw error;
          if (data) {
            setSelectedVenue(data);
            setSearchValue(data.title);
          }
        } catch (error) {
          console.error('Error fetching venue:', error);
        }
      };
      fetchVenue();
    }
  }, [lead?.venue_id]);

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        throw new Error('User email not found');
      }

      const leadData = {
        title: formData.get('title') as string,
        type: formData.get('type') as LeadType,
        status: formData.get('status') as LeadStatus,
        priority: formData.get('priority') as LeadPriority,
        company: formData.get('company')?.toString() || null,
        description: formData.get('description')?.toString() || null,
        venue_id: selectedVenue?.id || null,
        contact_info: {
          name: (formData.get('contact_name') || '') as string,
          email: (formData.get('contact_email') || '') as string,
          phone: (formData.get('contact_phone') || '') as string,
        },
        tags: [],
        last_contact_date: new Date().toISOString(),
        created_by_email: session.user.email
      };

      let leadResult;
      if (mode === 'create') {
        const { data: newLead, error: leadError } = await supabase
        .rpc('create_lead', { 
          lead_data: leadData
        });
        if (leadError) throw leadError;
        leadResult = newLead;
      } else {
        const { data: updatedLead, error: leadError } = await supabase
          .rpc('update_lead', { 
            p_lead_id: lead!.id,
            p_lead_data: leadData
          });
      if (leadError) throw leadError;
        leadResult = updatedLead;
      }

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: mode === 'create' ? 'Lead created successfully' : 'Lead updated successfully',
        type: 'success'
      });

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error saving lead:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: mode === 'create' ? 'Failed to create lead' : 'Failed to update lead',
        type: 'error'
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
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-[1200px] translate-x-[-50%] translate-y-[-50%] bg-[#131D43] border border-blue-800 text-white p-8 shadow-lg rounded-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <Dialog.Title className="text-xl font-bold mb-4">
              {mode === 'create' ? 'Create New Lead' : 'Edit Lead'}
            </Dialog.Title>
            <Dialog.Description className="text-gray-400 mt-2">
              <p>
                {mode === 'create' 
                  ? 'Add a new lead to your pipeline. Fill out the form below with the lead\'s details.'
                  : 'Update the lead\'s information using the form below.'}
              </p>
            </Dialog.Description>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Column 1: Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Enter lead title"
                      defaultValue={lead?.title || ''}
                      required
                      className="bg-[#1B2559]"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      name="company"
                      placeholder="Enter company name"
                      defaultValue={lead?.company || ''}
                      className="bg-[#1B2559] "
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select name="type" defaultValue={lead?.type || 'venue'}>
                      <SelectTrigger className="bg-[#1B2559] border ">
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
                    <Select name="status" defaultValue={lead?.status || 'new'}>
                      <SelectTrigger className="bg-[#1B2559] ">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f1729]  text-white">
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
                    <Select name="priority" defaultValue={lead?.priority || 'medium'}>
                      <SelectTrigger className="bg-[#1B2559] ">
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
                      defaultValue={lead?.contact_info.name || ''}
                      className="bg-[#1B2559] border "
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      placeholder="Enter contact email"
                      defaultValue={lead?.contact_info.email || ''}
                      className="bg-[#1B2559] border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      name="contact_phone"
                      placeholder="Enter contact phone"
                      defaultValue={lead?.contact_info.phone || ''}
                      className="bg-[#1B2559] border "
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Venue</Label>
                    <div className="relative">
                      <Input
                        placeholder="Search venues..."
                        value={searchValue}
                        onChange={(e) => handleVenueSearch(e.target.value)}
                        className="bg-[#1B2559] border "
                      />
                      {venues.length > 0 && (
                        <div className="absolute w-full z-50 top-full mt-1 bg-[#1B2559] rounded-md shadow-lg max-h-[200px] overflow-y-auto border ">
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
                        <div className="absolute w-full z-50 top-full mt-1 bg-[#1B2559] rounded-md shadow-lg p-2 border ">
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
                        className="bg-[#192555] border "
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
                          className="bg-[#192555] border "
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="venue_state">State</Label>
                        <Input
                          id="venue_state"
                          name="venue_state"
                          value={selectedVenue?.state || ''}
                          readOnly
                          className="bg-[#192555] border "
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="venue_zip">ZIP</Label>
                        <Input
                          id="venue_zip"
                          name="venue_zip"
                          value={selectedVenue?.zip || ''}
                          readOnly
                          className="bg-[#192555] border "
                        />
                      </div>
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
                  defaultValue={lead?.description || ''}
                  className="bg-[#1B2559] "
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                  className='bg-red-600 hover:bg-red-700 text-white border-black px-8'
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className='bg-green-700 border border-black hover:bg-green-800 px-8 text-white"'>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === 'create' ? 'Creating Lead...' : 'Saving Lead...'}
                    </>
                  ) : (
                    mode === 'create' ? 'Create Lead' : 'Save Lead'
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

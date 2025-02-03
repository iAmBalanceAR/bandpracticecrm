'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from '@/components/providers/supabase-client-provider';
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
import { toast } from 'react-hot-toast';

interface LeadDialogProps {
  children: React.ReactNode;
  lead?: Lead;  // Optional lead for edit mode
  mode?: 'create' | 'edit';
  venue?: {
    id: string;
    title: string;
    city?: string;
    state?: string;
    address?: string;
    zip?: string;
  };
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
  next_follow_up: string | null;
  expected_value: number | null;
}

interface LeadResponse {
  id: string;
  [key: string]: any;
}

const statusOptions: LeadStatus[] = ['new', 'contacted', 'in_progress', 'negotiating', 'won', 'lost', 'archived'];
const priorityOptions: LeadPriority[] = ['low', 'medium', 'high'];
const typeOptions: LeadType[] = ['venue', 'artist', 'promoter', 'other'];

// State abbreviation helper
const getStateAbbreviation = (fullState: string): string => {
  const stateMap: { [key: string]: string } = {
    'alabama': 'AL',
    'alaska': 'AK',
    'arizona': 'AZ',
    'arkansas': 'AR',
    'california': 'CA',
    'colorado': 'CO',
    'connecticut': 'CT',
    'delaware': 'DE',
    'florida': 'FL',
    'georgia': 'GA',
    'hawaii': 'HI',
    'idaho': 'ID',
    'illinois': 'IL',
    'indiana': 'IN',
    'iowa': 'IA',
    'kansas': 'KS',
    'kentucky': 'KY',
    'louisiana': 'LA',
    'maine': 'ME',
    'maryland': 'MD',
    'massachusetts': 'MA',
    'michigan': 'MI',
    'minnesota': 'MN',
    'mississippi': 'MS',
    'missouri': 'MO',
    'montana': 'MT',
    'nebraska': 'NE',
    'nevada': 'NV',
    'new hampshire': 'NH',
    'new jersey': 'NJ',
    'new mexico': 'NM',
    'new york': 'NY',
    'north carolina': 'NC',
    'north dakota': 'ND',
    'ohio': 'OH',
    'oklahoma': 'OK',
    'oregon': 'OR',
    'pennsylvania': 'PA',
    'rhode island': 'RI',
    'south carolina': 'SC',
    'south dakota': 'SD',
    'tennessee': 'TN',
    'texas': 'TX',
    'utah': 'UT',
    'vermont': 'VT',
    'virginia': 'VA',
    'washington': 'WA',
    'west virginia': 'WV',
    'wisconsin': 'WI',
    'wyoming': 'WY',
    'district of columbia': 'DC',
    'american samoa': 'AS',
    'guam': 'GU',
    'northern mariana islands': 'MP',
    'puerto rico': 'PR',
    'us virgin islands': 'VI',
  };

  const normalizedState = fullState?.toLowerCase().trim();
  return stateMap[normalizedState] || fullState;
};

export default function LeadDialog({ children, lead, mode = 'create', venue }: LeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [searchValue, setSearchValue] = useState(venue?.title || lead?.venue_id ? '' : '');
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
  const [selectedVenue, setSelectedVenue] = useState(venue || null);
  const [tagsInput, setTagsInput] = useState(lead?.tags?.join(', ') || '');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase, user } = useSupabase();
  const [isEditingVenue, setIsEditingVenue] = useState(false);

  // Initialize venue data if provided
  useEffect(() => {
    if (venue) {
      setSelectedVenue(venue);
      setSearchValue(venue.title);
    }
  }, [venue]);

  // Handle pre-populated venue data from URL
  useEffect(() => {
    const venueId = searchParams.get('venue_id');
    const venueTitle = searchParams.get('venue_title');
    const venueCity = searchParams.get('venue_city');
    const venueState = searchParams.get('venue_state');
    const venueAddress = searchParams.get('venue_address');
    const venueZip = searchParams.get('venue_zip');

    if (venueId && venueTitle) {
      setSelectedVenue({
        id: venueId,
        title: venueTitle,
        city: venueCity || undefined,
        state: venueState || undefined,
        address: venueAddress || undefined,
        zip: venueZip || undefined
      });
      setSearchValue(venueTitle);
      setOpen(true);
    }
  }, [searchParams]);

  // Fetch fresh lead data when dialog opens
  useEffect(() => {
    if (open && mode === 'edit' && lead?.id) {
      const fetchFreshLead = async () => {
        try {
          const { data, error } = await supabase
            .rpc('get_lead_with_details', { p_lead_id: lead.id });
          
          if (error) {
            console.error('Error fetching fresh lead data:', error);
            return;
          }
          
          if (data) {
            console.log('Fetched fresh lead data for dialog:', data);
            setCurrentLead(data);
          }
        } catch (err) {
          console.error('Error:', err);
        }
      };
      
      fetchFreshLead();
    }
  }, [open, mode, lead?.id, supabase]);

  // Use currentLead instead of lead prop for form defaults
  const activeLead = mode === 'edit' ? currentLead || lead : null;

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

  // Update tagsInput when currentLead changes
  useEffect(() => {
    if (mode === 'edit' && currentLead?.tags) {
      setTagsInput(currentLead.tags.join(', '));
    }
  }, [currentLead, mode]);

  const processTagsInput = (input: string): string[] => {
    return input
      .split(',')
      .map(tag => {
        const trimmedTag = tag.trim();
        if (!trimmedTag) return '';
        return trimmedTag.startsWith('#') ? trimmedTag : `#${trimmedTag}`;
      })
      .filter(tag => tag !== '');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const tags = processTagsInput(formData.get('tags')?.toString() || '');
      
      if (mode === 'edit' && lead) {
        // Get form values directly
        const title = formData.get('title') as string;
        const type = formData.get('type') as string;
        const status = formData.get('status') as string;
        const priority = formData.get('priority') as string;
        const company = formData.get('company')?.toString() || '';
        const description = formData.get('description')?.toString() || '';
        const venue_id = selectedVenue?.id || '';
        const contact_name = formData.get('contact_name')?.toString() || '';
        const contact_email = formData.get('contact_email')?.toString() || '';
        const contact_phone = formData.get('contact_phone')?.toString() || '';
        
        // Create the update data object directly
        const finalUpdateData = {
          title,
          type,
          status,
          priority,
          company,
          description,
          venue_id,
          contact_info: {
            name: contact_name,
            email: contact_email,
            phone: contact_phone
          },
          tags,
          next_follow_up: lead.next_follow_up,
          expected_value: lead.expected_value,
          last_contact_date: new Date().toISOString()
        };

        console.log('Updating lead with data:', finalUpdateData);
        
        const { data, error } = await supabase
          .rpc('update_lead', { 
            p_lead_id: lead.id, 
            p_lead_data: finalUpdateData 
          });

        if (error) {
          console.error('Update error:', error);
          toast.error('Failed to update lead');
          return;
        }
        
        if (!data) {
          console.error('No data returned from update');
          toast.error('Failed to update lead');
          return;
        }

        console.log('Lead updated successfully:', data);
        
        // Show success feedback
        setFeedbackModal({
          isOpen: true,
          title: 'Success',
          message: 'Lead updated successfully',
          type: 'success'
        });
        
        // Close dialog
        setOpen(false);
      } else {
        // Create new lead
        const newLeadData = {
          title: formData.get('title') as string,
          type: formData.get('type') as LeadType,
          status: formData.get('status') as LeadStatus,
          priority: formData.get('priority') as LeadPriority,
          company: formData.get('company')?.toString() || '',
          description: formData.get('description')?.toString() || '',
          venue_id: selectedVenue?.id || '',
          contact_info: {
            name: formData.get('contact_name')?.toString() || '',
            email: formData.get('contact_email')?.toString() || '',
            phone: formData.get('contact_phone')?.toString() || ''
          },
          tags,
          created_by_email: user?.email || '',
          last_contact_date: new Date().toISOString(),
          next_follow_up: null,
          expected_value: null
        };

        const { data: newLead, error } = await supabase
          .rpc('create_lead', { 
            lead_data: newLeadData 
          });

        if (error) {
          console.error('Create error:', error);
          toast.error('Failed to create lead');
          return;
        }

        if (!newLead) {
          console.error('No data returned from create');
          toast.error('Failed to create lead');
          return;
        }

        console.log('Lead created successfully:', newLead);
        
        // Show success feedback and navigate
        setFeedbackModal({
          isOpen: true,
          title: 'Success',
          message: 'Lead created successfully. You\'ll now be taken to your leads view.',
          type: 'success'
        });
        
        // Close dialog and navigate to main leads page
        setOpen(false);
        router.push('/leads');
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error('Failed to submit lead');
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
          <Dialog.Overlay className="fixed inset-0 bg-black/80 z-[100]" />
          <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[95vh] w-[95vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-lg bg-[#192555] border border-blue-800 p-6 text-white shadow-lg z-[101]">
            <Dialog.Title className="text-xl font-bold mb-2">
              {mode === 'create' ? 'Create New Lead' : 'Edit Lead'}
            </Dialog.Title>
            <Dialog.Description className="text-gray-400 text-xs mb-2">
              <p>
                {mode === 'create' 
                  ? 'Add a new lead to your pipeline. Fill out the form below with the lead\'s details.'
                  : 'Update the lead\'s information using the form below.'}
              </p>
            </Dialog.Description>
            {mode === 'edit' && !currentLead ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="Enter lead title"
                        defaultValue={activeLead?.title || ''}
                        required
                        className="bg-[#1B2559]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        name="company"
                        placeholder="Enter company name"
                        defaultValue={activeLead?.company || ''}
                        className="bg-[#1B2559] "
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select name="type" defaultValue={activeLead?.type || 'venue'}>
                        <SelectTrigger className="bg-[#1B2559] border ">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f1729] border-[#4A5568] text-white z-[102]">
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
                      <Select name="status" defaultValue={activeLead?.status || 'new'}>
                        <SelectTrigger className="bg-[#1B2559] ">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f1729] text-white z-[102]">
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
                      <Select name="priority" defaultValue={activeLead?.priority || 'medium'}>
                        <SelectTrigger className="bg-[#1B2559] ">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f1729] border-[#4A5568] text-white z-[102]">
                          {priorityOptions.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Put Tags Here */}
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        name="tags"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="Enter tags separated by commas"
                        className="bg-[#1B2559]"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_name">Contact Name</Label>
                      <Input
                        id="contact_name"
                        name="contact_name"
                        placeholder="Enter contact name"
                        defaultValue={activeLead?.contact_info.name || ''}
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
                        defaultValue={activeLead?.contact_info.email || ''}
                        className="bg-[#1B2559] border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        name="contact_phone"
                        placeholder="Enter contact phone"
                        defaultValue={activeLead?.contact_info.phone || ''}
                        className="bg-[#1B2559] border "
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Venue</Label>
                      {!selectedVenue || isEditingVenue ? (
                          <div className="relative">
                            <Input
                              placeholder="Search venues..."
                              value={searchValue}
                              onChange={(e) => {
                                handleVenueSearch(e.target.value);
                                setSearchValue(e.target.value);
                              }}
                              className="bg-[#1B2559] border"
                            />
                            {searchValue.length > 0 && (
                              <>
                                {venues.length > 0 && (
                                  <div className="absolute w-full z-50 top-full mt-1 bg-[#1B2559] rounded-md shadow-lg max-h-[200px] overflow-y-auto border">
                                    {venues.map((venue) => (
                                      <div
                                        key={venue.id}
                                        onClick={() => {
                                          handleVenueSelect(venue);
                                          setIsEditingVenue(false);
                                        }}
                                        className="cursor-pointer hover:bg-[#2a3c7d] p-2 flex justify-between items-center"
                                      >
                                        <span className="font-medium">{venue.title}</span>
                                        <span className="text-sm text-gray-400 ml-2">• {venue.city}, {getStateAbbreviation(venue.state || '')}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {searchValue.length > 2 && venues.length === 0 && (
                                  <div className="absolute w-full z-50 top-full mt-1 bg-[#1B2559] rounded-md shadow-lg p-2 border">
                                    No venues found
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                      ) : (
                        <div className="mt-2 flex justify-between items-center p-2 bg-[#1B2559] rounded-md">
                          <div className="space-y-1">
                            <div className="font-medium">{selectedVenue.title}</div>
                            <div className="text-sm text-gray-400">
                              {selectedVenue.address}
                            </div>
                            <div className="text-sm text-gray-400">
                              {selectedVenue.city}, {getStateAbbreviation(selectedVenue.state || '')} {selectedVenue.zip}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsEditingVenue(true);
                              setSearchValue('');
                              setVenues([]);
                            }}
                          >
                            Change
                          </Button>
                        </div>
                      )}
                    </div>

                    {(isEditingVenue || !selectedVenue) && (
                      <>
                          <div className="space-y-2">
                            <Label htmlFor="venue_address">Venue Address</Label>
                            <Input
                              id="venue_address"
                              name="venue_address"
                              value={selectedVenue?.address || ''}
                              readOnly
                              className="bg-[#192555] border"
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
                                className="bg-[#192555] border"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="venue_state">State</Label>
                              <Input
                                id="venue_state"
                                name="venue_state"
                                value={selectedVenue?.state || ''}
                                readOnly
                                className="bg-[#192555] border"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="venue_zip">ZIP</Label>
                              <Input
                                id="venue_zip"
                                name="venue_zip"
                                value={selectedVenue?.zip || ''}
                                readOnly
                                className="bg-[#192555] border"
                              />
                            </div>
                          </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter lead description"
                    defaultValue={activeLead?.description || ''}
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
            )}
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

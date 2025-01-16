'use client';

import { useState, useEffect } from 'react';
import { Lead, LeadCommunication } from '@/app/types/lead';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Mail, Phone, MessageSquare, Calendar, MoreVertical, Loader2 } from 'lucide-react';
import { FeedbackModal } from '@/components/ui/feedback-modal';
import { useSupabase } from '@/components/providers/supabase-client-provider';
import { useAuth } from '@/components/providers/auth-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LeadCommunicationsProps {
  lead: Lead & {
    communications: Partial<LeadCommunication>[];
  };
}

const communicationIcons = {
  email: <Mail className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
  note: <MessageSquare className="h-4 w-4" />,
} as const;

type FeedbackModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'delete';
  onConfirm?: () => Promise<void>;
};

export default function LeadCommunications({ lead }: LeadCommunicationsProps) {
  const [communications, setCommunications] = useState<Partial<LeadCommunication>[]>(lead.communications || []);
  const [isLoading, setIsLoading] = useState(false);
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
      .channel('lead_communications_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'communications',
          filter: `lead_id=eq.${lead.id}`
        }, 
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            setCommunications(prev => [payload.new as LeadCommunication, ...prev]);
          } else if (payload.eventType === 'DELETE' && payload.old.id) {
            setCommunications(prev => prev.filter(comm => comm.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.error('Failed to subscribe to communications changes:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, lead.id, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Please sign in to add communications',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const { data, error } = await supabase
        .rpc('create_communication', {
          comm_data: {
            lead_id: lead.id,
            type: formData.get('type'),
            content: formData.get('content'),
            date: new Date().toISOString(),
            sentiment: formData.get('sentiment') || 'neutral'
          }
        });

      if (error) throw error;

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: 'Communication added successfully',
        type: 'success'
      });
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error adding communication:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to add communication',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (communicationId: string) => {
    if (!isAuthenticated) {
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Please sign in to delete communications',
        type: 'error'
      });
      return;
    }

    setFeedbackModal({
      isOpen: true,
      title: 'Delete Communication',
      message: 'Are you sure you want to delete this communication?',
      type: 'delete',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .rpc('delete_communication', {
              comm_id: communicationId
            });

          if (error) throw error;

          setFeedbackModal({
            isOpen: true,
            title: 'Success',
            message: 'Communication deleted successfully',
            type: 'success'
          });
          router.refresh();
        } catch (error) {
          console.error('Error deleting communication:', error);
          setFeedbackModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete communication',
            type: 'error'
          });
        }
      }
    });
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">Please sign in to view and manage communications</p>
      </div>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Communications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue="note">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#111C44] text-white">
                  <SelectItem value="email" className="cursor-pointer">Email</SelectItem>
                  <SelectItem value="call" className="cursor-pointer">Call</SelectItem>
                  <SelectItem value="meeting" className="cursor-pointer">Meeting</SelectItem>
                  <SelectItem value="note" className="cursor-pointer">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sentiment">Sentiment</Label>
              <Select name="sentiment" defaultValue="neutral">
                <SelectTrigger>
                  <SelectValue placeholder="Select sentiment" />
                </SelectTrigger>
                <SelectContent className="bg-[#111C44] text-white">
                  <SelectItem value="positive" className="cursor-pointer">Positive</SelectItem>
                  <SelectItem value="neutral" className="cursor-pointer">Neutral</SelectItem>
                  <SelectItem value="negative" className="cursor-pointer">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Add communication details..."
              required
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Communication'}
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          {communications.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No communications yet. Add your first communication above.
            </p>
          ) : (
            communications
              .sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateB - dateA;
              })
              .map((communication) => (
                <div
                  key={communication.id}
                  className="flex gap-4 p-4 border rounded-lg"
                >
                  <div className="mt-1">
                    {communication.type && communicationIcons[communication.type as keyof typeof communicationIcons]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium capitalize">
                        {communication.type}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          {communication.date && formatDistanceToNow(new Date(communication.date), {
                            addSuffix: true,
                          })}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[200px] bg-[#111C44]">
                            {communication.id && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(communication.id as string)}
                                className="text-red-600 cursor-pointer"
                              >
                                Delete Communication
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {communication.content}
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
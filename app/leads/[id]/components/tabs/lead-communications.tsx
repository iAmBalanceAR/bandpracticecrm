import { useState } from 'react';
import { Lead, LeadCommunication } from '@/app/types/lead';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
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
import { Mail, Phone, MessageSquare, Calendar, Trash2, Loader2, SmilePlus, Meh, Frown } from 'lucide-react';
import { FeedbackModal } from '@/components/ui/feedback-modal';
import { useSupabase } from '@/components/providers/supabase-client-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface LeadCommunicationsProps {
  lead: Lead & {
    communications: Partial<LeadCommunication>[];
  };
  onUpdate?: () => void;
}

const communicationIcons = {
  email: <Mail className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
  note: <MessageSquare className="h-4 w-4" />,
} as const;

const sentimentIcons = {
  positive: <SmilePlus className="h-4 w-4 text-green-500" />,
  neutral: <Meh className="h-4 w-4 text-gray-500" />,
  negative: <Frown className="h-4 w-4 text-red-500" />,
} as const;

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

export default function LeadCommunications({ lead, onUpdate }: LeadCommunicationsProps) {
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
      (e.target as HTMLFormElement).reset();
      onUpdate?.();
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
          onUpdate?.();
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
        <p className="text-sm text-gray-400">Use the Communications feature to log and keep track of your interactions with current and potential clients.  This feature will bbe expanded in future updates.</p>
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
            <RichTextEditor
              content=""
              onChange={(content: string) => {
                const contentInput = document.createElement('input')
                contentInput.type = 'hidden'
                contentInput.name = 'content'
                contentInput.value = content
                const form = document.querySelector('form')
                const existingInput = form?.querySelector('input[name="content"]')
                if (existingInput) {
                  existingInput.remove()
                }
                form?.appendChild(contentInput)
              }}
              placeholder="Add communication details..."
              minHeight="100px"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}
            className="bg-green-700 text-white hover:bg-green-600 border border-black"
            >
              {isLoading ? 'Adding...' : '+ Add Communication'}
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          {lead.communications.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No communications yet. Add your first communication above.
            </p>
          ) : (
            lead.communications
              .sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateB - dateA;
              })
              .map((communication) => (
                <div
                  key={communication.id}
                  className="flex items-center gap-2 p-3 bg-[#0A1129] border border-white/40 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-[6px]">
                    <span className='text-green-500'>
                      {communication.type && communicationIcons[communication.type as keyof typeof communicationIcons]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-3">
                      <div className="border-r pr-4 border-blue-500 font-medium text-lg capitalize whitespace-nowrap">
                        {communication.type}
                        {communication.sentiment && (
                    <span className="float-right pl-[6px] mt-[8px]">
                      {sentimentIcons[communication.sentiment as keyof typeof sentimentIcons]}
                    </span>
                  )}
                      </div>
                      <span className="text-muted-foreground truncate">
                        {communication.content ? stripHtml(communication.content) : ''}
                      </span>

                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-nowrap text-right">

                    {communication.date && format(new Date(communication.date), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    onClick={() => communication.id && handleDelete(communication.id)}
                    className="hover:bg-[#2D3748] hover:text-rose-500 hover:shadow-rose-500 hover:shadow-sm hover:font-semibold text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
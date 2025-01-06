'use client';

import { useState } from 'react';
import { Lead } from '@/app/types/lead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Building2, 
  Mail, 
  Phone,
  ArrowLeft,
  Pencil,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import createClient from '@/utils/supabase/client';
import { toast } from 'sonner';
import LeadDialog from '@/app/leads/components/forms/lead-dialog';
import { FeedbackModal } from '@/components/ui/feedback-modal';

interface LeadHeaderProps {
  lead: Lead & {
    communications: any[];
    reminders: any[];
    lead_notes: any[];
    attachments: any[];
  };
}

const statusColors = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  in_progress: 'bg-purple-500',
  negotiating: 'bg-orange-500',
  won: 'bg-green-500',
  lost: 'bg-red-500',
  archived: 'bg-gray-500'
} as const;

const priorityColors = {
  low: 'bg-blue-600 text-white hover:bg-blue-700 hoveer:text-white',
  medium: 'bg-yellow-800 text-white hover:bg-yellow-900 hover:text-white',
  high: 'bg-red-700 text-white hover:bg-red-800'
} as const;

export default function LeadHeader({ lead }: LeadHeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'delete';
    onConfirm?: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  const handleStatusChange = async (newStatus: Lead['status']) => {
    try {
      const { error } = await supabase
        .rpc('update_lead_status', { 
          p_lead_id: lead.id,
          p_status: newStatus
        });

      if (error) throw error;

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: `Lead marked as ${newStatus}`,
        type: 'success'
      });
      router.refresh();
    } catch (err: any) {
      console.error('Error updating lead status:', err);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update lead status',
        type: 'error'
      });
    }
  };

  const handleDelete = () => {
    setFeedbackModal({
      isOpen: true,
      title: 'Delete Lead',
      message: 'Are you sure you want to delete this lead? This action cannot be undone.',
      type: 'delete',
      onConfirm: async () => {
        try {
          const { error, data } = await supabase
            .rpc('delete_lead', {
              p_lead_id: lead.id
            });

          if (error) throw error;
          if (!data) {
            throw new Error('Failed to delete lead - no permission');
          }

          setFeedbackModal({
            isOpen: true,
            title: 'Success',
            message: 'Lead deleted successfully',
            type: 'success'
          });
          router.push('/leads');
        } catch (err: any) {
          console.error('Error deleting lead:', err);
          setFeedbackModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete lead',
            type: 'error'
          });
        }
      }
    });
  };

  return (
    <div>
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        onConfirm={feedbackModal.onConfirm}
      />
      <div className="flex justify-start items-start gap-2 float-left">
        <LeadDialog lead={lead} mode="edit">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 bg-green-700 hover:bg-green600 hover:text-white border-black border"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </LeadDialog>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          className="gap-2 bg-red-700 hover:bg-red-600 hover:text-white border-black border"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
      <div className="flex justify-end items-center gap-2 mb-2">
        <Badge variant="secondary" className={priorityColors[lead.priority]}>
          {lead.priority}
        </Badge>
        <Badge className={statusColors[lead.status]}>
          {lead.status.replace('_', ' ')}
        </Badge>
     
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleStatusChange('won')}
              className="text-green-600"
            >
              Mark as Won
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange('lost')}
              className="text-red-600"
            >
              Mark as Lost
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-[#1B2559] border border-blue-800 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-6">
          {lead.company && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span className="text-md text-white">{lead.company}</span>
            </div>
          )}
          {lead.contact_info.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <a href={`mailto:${lead.contact_info.email}`} className="text-md text-white hover:text-blue-300">
                {lead.contact_info.email}
              </a>
            </div>
          )}
          {lead.contact_info.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <a href={`tel:${lead.contact_info.phone}`} className="text-md text-white hover:text-blue-300">
                {lead.contact_info.phone}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
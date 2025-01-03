'use client';

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
  Globe,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import createClient from '@/utils/supabase/client';
import { toast } from 'sonner';

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
  low: 'bg-blue-200 text-blue-700',
  medium: 'bg-yellow-200 text-yellow-700',
  high: 'bg-red-200 text-red-700'
} as const;

export default function LeadHeader({ lead }: LeadHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleStatusChange = async (newStatus: Lead['status']) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', lead.id);

      if (error) throw error;

      toast.success('Lead status updated');
      router.refresh();
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this lead?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id);

      if (error) throw error;

      toast.success('Lead deleted');
      router.push('/leads');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          asChild
        >
          <Link href="/leads">
            <ArrowLeft className="h-4 w-4" />
            Back to Leads
          </Link>
        </Button>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2">{lead.title}</h1>
          <div className="flex items-center gap-6 text-muted-foreground">
            {lead.company && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{lead.company}</span>
              </div>
            )}
            {lead.contact_info.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${lead.contact_info.email}`} className="hover:underline">
                  {lead.contact_info.email}
                </a>
              </div>
            )}
            {lead.contact_info.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href={`tel:${lead.contact_info.phone}`} className="hover:underline">
                  {lead.contact_info.phone}
                </a>
              </div>
            )}
            {lead.contact_info.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <a 
                  href={lead.contact_info.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Website
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
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
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600"
              >
                Delete Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { Lead } from '@/app/types/lead';
import { useSupabase } from '@/components/providers/supabase-client-provider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500'
} as const;

interface LeadPayload {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  company?: string;
  description?: string;
  venue_id?: string;
  contact_info: Record<string, any>;
  tags?: string[];
  next_follow_up?: string;
  expected_value?: number;
  last_contact_date?: string;
  created_by: string;
  created_by_email: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

type RealtimeLeadPayload = RealtimePostgresChangesPayload<{
  new: LeadPayload | null;
  old: LeadPayload | null;
}>;

export default function LeadsDataView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const router = useRouter();

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_leads')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        toast.error('Failed to fetch leads');
        return;
      }
      
      setLeads((data || []) as Lead[]);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('leads_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'leads',
        }, 
        async (payload: RealtimeLeadPayload) => {
          const leadId = ((payload.new as LeadPayload) || (payload.old as LeadPayload))?.id;
          if (!leadId) return;

          const { data, error } = await supabase
            .rpc('get_leads')
            .eq('id', leadId)
            .single();

          if (error) {
            console.error('Error fetching updated lead:', error);
            return;
          }

          const updatedLead = data as Lead;
          
          if (payload.eventType === 'INSERT') {
            setLeads(prev => [updatedLead, ...prev]);
          } else if (payload.eventType === 'DELETE' && ((payload as RealtimeLeadPayload).old as LeadPayload)?.id) {
            setLeads(prev => prev.filter(lead => lead.id !== ((payload as RealtimeLeadPayload).old as LeadPayload).id));
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev => prev.map(lead => 
              lead.id === updatedLead.id ? updatedLead : lead
            ));
          }
        }
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.error('Failed to subscribe to leads changes:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-[#192555] border-blue-800 animate-pulse h-48" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <Card className="bg-[#192555] border-blue-800">
        <div className="p-6 text-center text-white">
          <p className="mb-4">No leads found.</p>
          <p className="text-gray-400">
            Click the "New Lead" button to create your first lead.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {leads.map((lead) => (
        <Link key={lead.id} href={`/leads/${lead.id}`}>
          <Card className="bg-[#192555] border-blue-800 hover:border-blue-600 transition-colors cursor-pointer min-h-[150px]">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-white truncate">
                  {lead.title}
                </h3>
                <div className="flex gap-2">
                  <Badge 
                    variant="secondary"
                    className={priorityColors[lead.priority]}
                  >
                    {lead.priority}
                  </Badge>
                  <Badge 
                    variant="secondary"
                    className={statusColors[lead.status]}
                  >
                    {lead.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              
              {lead.company && (
                <p className="text-gray-400 mb-2">{lead.company}</p>
              )}
              
              <div className="flex flex-col gap-1 text-sm text-gray-300">
                {lead.contact_info.name && (
                  <p>Contact: {lead.contact_info.name}</p>
                )}
                <p className="text-gray-400">
                  Last Updated: {format(new Date(lead.updated_at), 'MMM d, yyyy')}
                </p>
              </div>

              {lead.tags && lead.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {lead.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {lead.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{lead.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
} 
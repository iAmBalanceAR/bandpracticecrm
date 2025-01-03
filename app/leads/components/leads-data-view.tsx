'use client';

import { useEffect, useState } from 'react';
import { Lead } from '@/app/types/lead';
import createClient from '@/utils/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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

export default function LeadsDataView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        throw error;
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
          table: 'leads' 
        }, 
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setLeads(prev => [payload.new as Lead, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev => prev.map(lead => 
              lead.id === payload.new.id ? (payload.new as Lead) : lead
            ));
          }
        }
      )
      .subscribe();

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
          <Card className="bg-[#192555] border-blue-800 hover:border-blue-600 transition-colors cursor-pointer">
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
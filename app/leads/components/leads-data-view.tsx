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
import { motion, AnimatePresence } from 'framer-motion';

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
    }
  };

  // Initial load with loading state
  useEffect(() => {
    setIsLoading(true);
    fetchLeads().finally(() => setIsLoading(false));
  }, []);

  // Set up polling for updates without loading state
  useEffect(() => {
    const intervalId = setInterval(fetchLeads, 5000);
    return () => clearInterval(intervalId);
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
      <AnimatePresence mode="popLayout">
        {leads.map((lead) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Link href={`/leads/${lead.id}`}>
              <motion.div
                initial={{ opacity: 1, x: 0, y: 0 }}
                whileHover={{ scale: 1.01 }}
                animate={{ opacity: 1, x: -3, y: 0 }}
                transition={{ type: 'tween', duration: 0.02 }}
              >
                <Card className="bg-[#1B2559] border-blue-800 hover:bg-[#0F1729] transition-colors cursor-pointer min-h-[150px]">
                  <div className="p-0 pt-0">
                    <div className='bg-[#0F1729] rounded-md pt-1 pl-2 pr-2 pb-2'>

                    <h3 className="clear-both pt-0 mt-0 text-lg font-semibold text-white truncate flex flex-row gap-1">
                      {lead.title}
                    </h3>
                    <div className="flex items-start mb-0 mt-1">
                    
                    <div className="text-black flex gap-1">
                      <Badge 
                        variant="secondary"
                        className={priorityColors[lead.priority]}
                      >
                        {lead.priority}
                      </Badge>
                      &nbsp;
                      <Badge 
                        variant="secondary"
                        className={statusColors[lead.status]}
                      >
                        {lead.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                    </div>
                    <div className="text-sm text-gray-300m mb-0 pl-2 pr-2 pt-2 pb-0 ">
                      <p className="text-gray-400 pt-0 mt-0 pb-0 font-bold">{lead.company || ''}</p>
                      {lead.contact_info.name && (
                        <p>Contact: {lead.contact_info.name}</p>
                      )}

                      <p className="text-gray-400">
                        Last Updated: {format(new Date(lead.updated_at), 'MMM d, yyyy')}
                      </p>
                    </div>

                    {lead.tags && lead.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3 pb-2 pl-2 pr-2">
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
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 
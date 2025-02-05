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
import LeadsSearch, { LeadFilters } from './leads-search';
import { ClipboardList } from 'lucide-react';
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
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<LeadFilters>({
    search: "",
    status: "all",
    type: "all",
    priority: "all",
    dateRange: undefined,
    location: "all",
    sort: "newest"
  });
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

  // Apply filters to leads
  useEffect(() => {
    let result = [...leads];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(lead => 
        lead.title.toLowerCase().includes(searchLower) ||
        lead.company?.toLowerCase().includes(searchLower) ||
        lead.contact_info?.name?.toLowerCase().includes(searchLower) ||
        lead.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(lead => lead.status === filters.status);
    }

    // Apply type filter
    if (filters.type !== 'all') {
      result = result.filter(lead => lead.type === filters.type);
    }

    // Apply priority filter
    if (filters.priority !== 'all') {
      result = result.filter(lead => lead.priority === filters.priority);
    }

    // Apply date range filter
    if (filters.dateRange?.from && filters.dateRange?.to) {
      result = result.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= filters.dateRange!.from! && 
               leadDate <= filters.dateRange!.to!;
      });
    }

    // Apply sorting
    switch (filters.sort) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        result.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);
        break;
      case 'status':
        result.sort((a, b) => a.status.localeCompare(b.status));
        break;
      default: // 'newest'
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredLeads(result);
  }, [leads, filters]);

  if (isLoading) {
    return (
      <>
        <LeadsSearch onFiltersChange={setFilters} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-[#192555] border-blue-800 animate-pulse h-48" />
          ))}
        </div>
      </>
    );
  }

  if (leads.length === 0) {
    return (
      <>
        <LeadsSearch onFiltersChange={setFilters} />
        <Card className="bg-[#192555] border-blue-800">
          <div className="p-6 text-center text-white">
            <ClipboardList className="w-24 h-24 mx-auto mb-4 text-[#d83b34]" />
            <p className="mb-4 text-md">No leads found.</p>
            <p className="text-gray-400 text-md">
              Click the "New Lead" button to create your first lead.


            </p>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <LeadsSearch onFiltersChange={setFilters} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredLeads.map((lead) => (
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
                        <div className="flex items-start mb-0 mt-1 p-0">
                          <div className="text-black flex gap-1 p-0">
                            <Badge 
                              variant="secondary"
                              className={priorityColors[lead.priority as keyof typeof priorityColors]}
                            >
                              {lead.priority}
                            </Badge>
                            &nbsp;
                            <Badge 
                              variant="secondary"
                              className={statusColors[lead.status as keyof typeof statusColors]}
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
    </>
  );
} 
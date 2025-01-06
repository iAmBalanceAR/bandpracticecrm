'use client';

import { useEffect, useState } from 'react';
import createClient from '@/utils/supabase/client';
import { Lead } from '@/app/types/lead';
import LeadCard from '@/app/leads/components/lead-list/lead-card';
import { Card } from '@/components/ui/card';
import { useLeadFilters } from '@/app/leads/hooks/use-lead-filters';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LeadList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { filters } = useLeadFilters();
  const supabase = createClient();
  const router = useRouter();

  const fetchLeads = async () => {
    console.log('fetchLeads: Starting fetch');
    setIsLoading(true);
    try {
      // Log user session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current user email:', session?.user?.email);

      let query = supabase
        .from('leads')
        .select('*')
        .order('updated_at', { ascending: false });

      // Log the query we're about to execute
      const { data: queryData, count } = await supabase
        .from('leads')
        .select('*', { count: 'exact' });
      console.log('Total leads in table:', count);
      console.log('Sample lead data:', queryData?.[0]);

      console.log('fetchLeads: Building query with filters:', filters);
      // Apply filters
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters.type?.length) {
        query = query.in('type', filters.type);
      }
      if (filters.assignedTo?.length) {
        query = query.in('assigned_to', filters.assignedTo);
      }
      if (filters.tags?.length) {
        query = query.contains('tags', filters.tags);
      }
      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from)
          .lte('created_at', filters.dateRange.to);
      }

      console.log('fetchLeads: Executing query');
      const { data, error } = await query;
      
      if (error) {
        console.error('fetchLeads: Query error:', error);
        throw error;
      }
      
      console.log('fetchLeads: Success, got', data?.length, 'leads');
      console.log('First lead:', data?.[0]);
      setLeads((data || []) as Lead[]);
    } catch (error) {
      console.error('fetchLeads: Error:', error);
      toast.error('Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('LeadList: Filter change detected, fetching leads');
    fetchLeads();
  }, [filters]);

  // Subscribe to realtime changes
  useEffect(() => {
    console.log('LeadList: Setting up realtime subscription');
    const channel = supabase
      .channel('leads_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'leads' 
        }, 
        (payload: any) => {
          console.log('LeadList: Realtime event received:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            console.log('LeadList: Handling INSERT');
            setLeads(prev => [payload.new as Lead, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            console.log('LeadList: Handling DELETE');
            setLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            console.log('LeadList: Handling UPDATE');
            setLeads(prev => prev.map(lead => 
              lead.id === payload.new.id ? (payload.new as Lead) : lead
            ));
          }
        }
      )
      .subscribe((status) => {
        console.log('LeadList: Subscription status:', status);
      });

    return () => {
      console.log('LeadList: Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No leads found. Try adjusting your filters or create a new lead.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </div>
  );
} 
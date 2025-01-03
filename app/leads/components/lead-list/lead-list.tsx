'use client';

import { useEffect, useState } from 'react';
import createClient from '@/utils/supabase/client';
import { Lead } from '@/app/types/lead';
import LeadCard from '@/app/leads/components/lead-list/lead-card';
import { Card } from '@/components/ui/card';
import { useLeadFilters } from '@/app/leads/hooks/use-lead-filters';
import { Skeleton } from '@/components/ui/skeleton';

export default function LeadList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { filters } = useLeadFilters();
  const supabase = createClient();

  useEffect(() => {
    async function fetchLeads() {
      setIsLoading(true);
      try {
        let query = supabase
          .from('leads')
          .select('*')
          .order('updated_at', { ascending: false });

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
            .gte('created_at', filters.dateRange.start)
            .lte('created_at', filters.dateRange.end);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        setLeads(data as Lead[]);
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeads();
  }, [filters]);

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
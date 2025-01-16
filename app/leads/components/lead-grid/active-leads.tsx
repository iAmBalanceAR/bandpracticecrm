'use client';

import { useEffect, useState } from 'react';
import { Lead } from '@/app/types/lead';
import { useSupabase } from '@/components/providers/supabase-client-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Building2, Mail, Phone, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ActiveLeads() {
  const { supabase } = useSupabase();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setLeads((data || []) as Lead[]);
    } catch (error) {
      console.error('Error fetching active leads:', error);
      toast.error('Failed to fetch active leads');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchActiveLeads();
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
          filter: 'status=eq.active'
        }, 
        (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new.status === 'active') {
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
      console.log('Cleaning up realtime subscription...');
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
        <CardContent className="p-6 text-center text-white">
          <p className="mb-4">No active leads found.</p>
          <p className="text-gray-400">
            Click the "New Lead" button above to create your first lead.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {leads.map((lead) => (
        <Link key={lead.id} href={`/leads/${lead.id}`}>
          <Card 
            className="bg-[#192555] border-blue-800 hover:border-blue-600 transition-colors cursor-pointer "
          >
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {lead.title}
                  </h3>
                  <Badge 
                    variant="secondary"
                    className={
                      lead.status === 'new' ? 'bg-blue-500' :
                      lead.status === 'contacted' ? 'bg-yellow-500' :
                      lead.status === 'in_progress' ? 'bg-purple-500' :
                      'bg-orange-500'
                    }
                  >
                    {lead.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {lead.company || 'No company'}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Last Updated: {format(new Date(lead.updated_at), 'MMM d, yyyy')}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
} 
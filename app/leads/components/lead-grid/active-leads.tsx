'use client';

import { useEffect, useState } from 'react';
import { Lead } from '@/app/types/lead';
import createClient from '@/utils/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Building2, Mail, Phone, Calendar } from 'lucide-react';

export default function ActiveLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchActiveLeads() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .in('status', ['new', 'contacted', 'in_progress', 'negotiating'])
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setLeads(data || []);
      } catch (error) {
        console.error('Error fetching active leads:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActiveLeads();
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
          <Card className="bg-[#192555] border-blue-800 hover:border-blue-600 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
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
              
              {lead.company && (
                <div className="flex items-center gap-2 text-gray-300 mb-2">
                  <Building2 className="h-4 w-4" />
                  <span className="truncate">{lead.company}</span>
                </div>
              )}
              
              {lead.contact_info?.email && (
                <div className="flex items-center gap-2 text-gray-300 mb-2">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{lead.contact_info.email}</span>
                </div>
              )}
              
              {lead.contact_info?.phone && (
                <div className="flex items-center gap-2 text-gray-300 mb-2">
                  <Phone className="h-4 w-4" />
                  <span>{lead.contact_info.phone}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-gray-400 mt-3 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Last contact: {format(new Date(lead.last_contact_date), 'MMM d, yyyy')}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
} 
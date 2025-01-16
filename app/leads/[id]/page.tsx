'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useSupabase } from '@/components/providers/supabase-client-provider';
import { notFound } from 'next/navigation';
import LeadHeader from '@/app/leads/[id]/components/lead-header';
import LeadTabs from '@/app/leads/[id]/components/lead-tabs';
import CustomSectionHeader from '@/components/common/CustomSectionHeader';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Loader2 } from 'lucide-react';

interface LeadPageProps {
  params: {
    id: string;
  };
}

export default function LeadPage({ params }: LeadPageProps) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [lead, setLead] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    async function fetchLead() {
      if (!isAuthenticated) return;

      try {
        const { data, error } = await supabase
          .rpc('get_lead_with_details', { p_lead_id: params.id });

        if (error) {
          console.error('Error fetching lead:', error);
          notFound();
        }

        if (!data) {
          console.error('Lead not found');
          notFound();
        }

        setLead(data);
      } catch (error) {
        console.error('Error:', error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    }

    fetchLead();
  }, [isAuthenticated, params.id, supabase]);

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="bg-[#192555] border-blue-800">
        <div className="p-6 text-center text-white">
          <p className="mb-4">Please sign in to view lead details.</p>
        </div>
      </Card>
    );
  }

  if (!lead) return null;

  return (
    <CustomSectionHeader title="Lead Management" underlineColor="#008ffb">
      <Card className="bg-[#111C44] min-h-[500px] border-blue-800 p-0 m-0">
        <CardContent className="p-6">
          <Link 
            href="/leads" 
            className="inline-flex items-center text-md text-slate-300 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Leads
          </Link>

          <div className="bg-[#1B2559] border border-blue-800 rounded-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-white text-shadow-sm font-mono text-shadow-x-2 text-shadow-y-2 text-shadow-black mb-4">
              {lead.title}
            </h1>
            <div className="flex items-center gap-6 text-md text-gray-400">
              {lead.contact_info.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${lead.contact_info.email}`} className="hover:text-white">
                    {lead.contact_info.email}
                  </a>
                </div>
              )}
              {lead.contact_info.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${lead.contact_info.phone}`} className="hover:text-white">
                    {lead.contact_info.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          <LeadHeader lead={lead} />
          <div className="mt-8">
            <LeadTabs lead={lead} />
          </div>
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
} 
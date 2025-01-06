import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import LeadHeader from '@/app/leads/[id]/components/lead-header';
import LeadTabs from '@/app/leads/[id]/components/lead-tabs';
import CustomSectionHeader from '@/components/common/CustomSectionHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Lead Details',
  description: 'View and manage lead details',
};

interface LeadPageProps {
  params: {
    id: string;
  };
}

export default async function LeadPage({ params }: LeadPageProps) {
  const supabase = createClient();

  const { data: lead, error } = await supabase
    .rpc('get_lead_with_details', { p_lead_id: params.id });

  if (error) {
    console.error('Error fetching lead:', error);
    notFound();
  }

  if (!lead) {
    console.error('Lead not found');
    notFound();
  }

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
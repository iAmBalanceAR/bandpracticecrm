import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import LeadHeader from '@/app/leads/[id]/components/lead-header';
import LeadTabs from '@/app/leads/[id]/components/lead-tabs';
import CustomSectionHeader from '@/components/common/CustomSectionHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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

  console.log('Fetching lead with ID:', params.id);

  const { data: lead, error } = await supabase
    .from('leads')
    .select(`
      *,
      lead_notes (
        id,
        content,
        is_private,
        created_by_email,
        created_at,
        updated_at
      ),
      reminders (
        id,
        title,
        description,
        due_date,
        status,
        priority,
        created_by_email,
        created_at,
        completed_at
      )
    `)
    .eq('id', params.id)
    .single();

  if (error) {
    console.error('Error fetching lead:', error);
    notFound();
  }

  if (!lead) {
    console.error('Lead not found');
    notFound();
  }

  // Add empty arrays for missing properties
  const enrichedLead = {
    ...lead,
    communications: [],
    attachments: [],
    lead_notes: lead.lead_notes || [],
    reminders: lead.reminders || []
  };

  console.log('Lead found:', enrichedLead);

  return (
    <CustomSectionHeader title={enrichedLead.title} underlineColor="#008ffb">
      <Card className="bg-[#111C44] min-h-[500px] border-none p-0 m-0">
        <CardHeader className="pb-0 mb-0">
          <CardTitle className="flex justify-between items-center text-3xl font-bold">
            <div className="">
              <div className="flex flex-auto tracking-tight text-3xl">
                <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-white text-shadow-sm font-mono font-normal text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                  Lead Details
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeadHeader lead={enrichedLead} />
          <LeadTabs lead={enrichedLead} />
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
} 
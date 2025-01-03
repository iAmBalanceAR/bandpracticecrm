import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import LeadHeader from './components/lead-header';
import LeadTabs from './components/lead-tabs';

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
    .from('leads')
    .select(`
      *,
      communications (
        *
      ),
      reminders (
        *
      ),
      lead_notes (
        *
      ),
      attachments (
        *
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !lead) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <LeadHeader lead={lead} />
      <LeadTabs lead={lead} />
    </div>
  );
} 
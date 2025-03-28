'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { Lead } from '@/app/types/lead';
import { motion, AnimatePresence } from 'framer-motion';

interface LeadPageProps {
  params: {
    id: string;
  };
}

export default function LeadPage({ params }: LeadPageProps) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch lead data
  const fetchLead = useCallback(async (showLoading = true) => {
    if (!isAuthenticated) return;
    
    try {
      if (showLoading) setIsLoading(true);
      const { data, error } = await supabase
        .rpc('get_lead_with_details', { p_lead_id: params.id });
      
      if (error) {
        console.error('Error fetching lead:', error);
        setError('Failed to load lead details');
        return;
      }
      
      if (data) {
        setLead(prev => {
          if (!prev) return data;

          // Create a helper function to deduplicate arrays by ID
          const dedupeById = (arr: any[]) => {
            const seen = new Set();
            return arr.filter(item => {
              if (!item.id) return true;
              const duplicate = seen.has(item.id);
              seen.add(item.id);
              return !duplicate;
            });
          };

          // Create new lead object with deduplicated arrays
          const newLead = {
            ...data,
            communications: dedupeById(data.communications || []),
            reminders: dedupeById(data.reminders || []),
            lead_notes: dedupeById(data.lead_notes || []),
            attachments: dedupeById(data.attachments || [])
          };

          // Only update if there are actual changes
          if (JSON.stringify(prev) === JSON.stringify(newLead)) {
            return prev;
          }

          return newLead;
        });
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [isAuthenticated, params.id, supabase]);

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, authLoading, router]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchLead(true);
    }
  }, [isAuthenticated, fetchLead]);

  // Set up polling for updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(() => {
      fetchLead(false); // Don't show loading state for polling updates
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, fetchLead]);

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-[#192555] border-blue-800">
        <div className="p-6 text-center text-white">
          <p className="mb-4">{error}</p>
        </div>
      </Card>
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
            className="inline-flex border-black border hover:bg-blue-800 bg-blue-600 text-white p-[6px] rounded-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1 mt-1" />
            Back to Leads
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={lead.updated_at}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
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

              <LeadHeader lead={lead} onUpdate={() => fetchLead(true)} />
              <div className="mt-8">
                <LeadTabs lead={lead} onUpdate={() => fetchLead(true)} />
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
} 
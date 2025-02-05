'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import LeadsDataView from '@/app/leads/components/leads-data-view';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import LeadDialog from './components/forms/lead-dialog';
import CustomSectionHeader from '@/components/common/CustomSectionHeader';

export default function LeadsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
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
          <p className="mb-4">Please sign in to view leads.</p>
        </div>
      </Card>
    );
  }

  return (
      <CustomSectionHeader
        title="Lead Management"
      underlineColor="#008ffb"
            >
      <Card className="bg-[#111C44] min-h-[500px] border-blue-800 p-0 m-0">
        <CardContent className="p-6">
          <h1 className="font-mono text-white text-2xl float-left text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
            Search Leads
          </h1>
          <div className="flex justify-end mb-4">
            <LeadDialog>
              <Button className="bg-green-700 text-white hover:bg-green-600">
                <Plus className="h-4 w-4 mr-2" />
                New Lead
            </Button>
            </LeadDialog>
          </div>
            <LeadsDataView />
          </CardContent>
        </Card>
    </CustomSectionHeader>
  );
} 
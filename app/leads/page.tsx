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
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

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
    <CustomSectionHeader title="Lead Management" underlineColor="#D83B34">
      <Card className="bg-[#111C44] min-h-[500px] border-none p-0 m-0">
        <CardHeader className="pb-0 mb-0">
          <CardTitle className="flex justify-between items-center text-3xl font-bold">
            <div className="">
              <div className="flex flex-auto tracking-tight text-3xl">
                <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-white text-shadow-sm font-mono font-normal text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                  Leads
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <LeadDialog>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-0  h-6 w-6" />
                  New Lead
                </Button>
              </LeadDialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeadsDataView />
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
} 
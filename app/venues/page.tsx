'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import CustomSectionHeader from '@/components/common/CustomSectionHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import VenueSearchMain from '@/components/crm/venues-search-main';
import { Loader2 } from "lucide-react";

export default function VenuesPage() {
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
          <p className="mb-4">Please sign in to access the venue database.</p>
        </div>
      </Card>
    );
  }

  return (
    <CustomSectionHeader title="Venue Database Search" underlineColor="#00E396">
      <Card className="bg-[#111C44] min-h-[500px] border-none p-0 m-0">
        <CardHeader className="pb-0 mb-0">
          <CardTitle className="flex justify-between items-center text-3xl font-bold">
            <div className="">
              <div className="flex flex-auto tracking-tight text-3xl">
                <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-white text-shadow-sm font-mono font-normal text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                  Venues
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VenueSearchMain />
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
} 
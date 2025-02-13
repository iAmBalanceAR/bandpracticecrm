"use client"

import React from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import GigManagement from "@/components/crm/gig-management";
import CustomSectionHeader from "@/components/common/CustomSectionHeader";
import { Card } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

export default function Page() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px] bg-[#111C44]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="bg-[#192555] min-h-[500px] border-blue-800">
        <div className="p-6 text-center text-white">
          <p className="mb-4">Please sign in to view the calendar.</p>
        </div>
      </Card>
    );
  }

  return (
    <CustomSectionHeader title="Tour Calendar" underlineColor="#D9862F">
      <Card className="bg-[#111C44] border-none p-0 m-0">
        <GigManagement 
          filterType="upcoming" 
          onAddNew={() => {}} 
        />
      </Card>
    </CustomSectionHeader>
  );
}
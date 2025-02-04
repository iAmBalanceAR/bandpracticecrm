"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import CustomSectionHeader from "@/components/common/CustomSectionHeader"
import { TourReportGenerator } from './components/tour-report-generator'
import { Loader2 } from 'lucide-react'


export default function TourExports() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="bg-[#192555] border-blue-800">
        <div className="p-6 text-center text-white">
          <p className="mb-4">Please sign in to access tour exports.</p>
        </div>
      </Card>
    );
  }

  return (
    <CustomSectionHeader title="Tour Route Exports" underlineColor="#0f1729">
      <Card className="bg-[#111C44] min-h-[500px] border-none p-0 m-0">
        <CardHeader className="pb-0 mb-0">
          <CardTitle className="flex justify-between items-center text-3xl font-bold">
            <div className="">
              <div className="flex flex-auto tracking-tight text-3xl">
                <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-white text-shadow-sm font-mono font-normal text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                  Tour Route Exports
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TourReportGenerator />
        </CardContent>
      </Card>
    </CustomSectionHeader>
  )
} 
'use client';

import { useEffect } from 'react';
import TourList from '@/components/crm/tours/tour-list';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import CustomSectionHeader from '@/components/common/CustomSectionHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ToursPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router]);

  return (
    <CustomSectionHeader title="Tour Management" underlineColor="#D83B34">
      <Card className="bg-[#111C44] min-h-[500px] border-none p-0 m-0">
        <CardHeader className="pb-0 mb-0">
          <CardTitle className="flex justify-between items-center text-3xl font-bold">
            <div className="">
              <div className="flex flex-auto tracking-tight text-3xl">
                <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-white text-shadow-sm font-mono font-normal text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                  Tours
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TourList />
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
} 
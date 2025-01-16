"use client"
import TourManagement from "@/components/crm/tour-management";
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import CustomSectionHeader from '@/components/common/CustomSectionHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useEffect } from 'react';

export default function Page() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router]);

  return (
    <CustomSectionHeader title="Tour Route" underlineColor="#D83B34">
      <Card className="bg-[#111C44] min-h-[500px] border-none p-0 m-0">
        <CardHeader className="pb-0 mb-0">
          <CardTitle className="flex justify-between items-center text-3xl font-bold">
            <div className="">
              <div className="flex flex-auto tracking-tight text-3xl">
                <div >  
              </div>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
            <h3 className="text-2xl mb-0">
                  <span className="mx-6 text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                    Tour Route Map
                  </span>
                  <div className="border-[#ff9920] border-b-2 -mt-2 mb-0  h-2 ml-6  mr-6"></div>
                </h3>
          <TourManagement />
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
}
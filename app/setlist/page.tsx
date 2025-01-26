"use client"
import React from "react"
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import CustomSectionHeader from "@/components/common/CustomSectionHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import SetlistManagement from "@/components/setlist/setlist-management";

export default function Page() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router]);

  return (
    <CustomSectionHeader title="SetList Generator" underlineColor="#ff9920">
      <Card className="bg-[#111C44] min-h-[500px] border-none p-0 m-0">
        <CardHeader className="pb-0 mb-0">
          <CardTitle className="text-2xl">
            {/* <h1 className="font-mono text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
              Saved Setlists
            </h1> */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SetlistManagement />
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
}
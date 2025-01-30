"use client"
import React, { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import GigManagement from "@/components/crm/gig-management";
import CustomSectionHeader from "@/components/common/CustomSectionHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

export default function Page() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = React.useState("upcoming");
  const [isFormVisible, setIsFormVisible] = React.useState(false);

  useEffect(() => {
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
    <CustomSectionHeader title="Gig Calendar" underlineColor="#D9862F">
      <Card className="bg-[#111C44] border-none p-0 m-0">
        {!isFormVisible && (
          <CardHeader className="pb-0 mb-0">
            <CardTitle className="flex justify-between items-center text-3xl font-bold">
              <div className="flex flex-auto tracking-tight text-3xl">
                <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-white text-shadow-sm font-mono font-normal text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                  Booked Gigs
                </span>
              </div>
              <Button 
                onClick={() => setIsFormVisible(true)}
                className="bg-green-700 text-white hover:bg-green-600"
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Gig
              </Button>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          {!isFormVisible ? (
            <Tabs 
              defaultValue="upcoming"
              className="w-full mt-4"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2 bg-[#192555] mb-4">
                <TabsTrigger 
                  value="upcoming"
                  className="data-[state=active]:bg-[#111C44] data-[state=active]:text-white text-gray-400"
                >
                  Upcoming Gigs
                </TabsTrigger>
                <TabsTrigger 
                  value="past"
                  className="data-[state=active]:bg-[#111C44] data-[state=active]:text-white text-gray-400"
                >
                  Past Gigs
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming">
                <GigManagement 
                  filterType="upcoming" 
                  isFormVisible={isFormVisible}
                  setIsFormVisible={setIsFormVisible}
                />
              </TabsContent>
              <TabsContent value="past">
                <GigManagement 
                  filterType="past" 
                  isFormVisible={isFormVisible}
                  setIsFormVisible={setIsFormVisible}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <GigManagement 
              filterType={activeTab as 'upcoming' | 'past'}
              isFormVisible={isFormVisible}
              setIsFormVisible={setIsFormVisible}
            />
          )}
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
}
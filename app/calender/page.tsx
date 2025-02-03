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
import { useSupabase } from '@/components/providers/supabase-client-provider';
import { useState } from 'react';
import { FeedbackModal } from '@/components/ui/feedback-modal';

export default function Page() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = React.useState("upcoming");
  const [isFormVisible, setIsFormVisible] = React.useState(false);
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error' as const
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router]);

  const checkForTours = async () => {
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('id')
        .limit(1);

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking for tours:', error);
      return false;
    }
  };

  const handleAddNewGig = async () => {
    const hasTours = await checkForTours();
    
    if (!hasTours) {
      setFeedbackModal({
        isOpen: true,
        title: 'No Tours Available',
        message: 'Please create at least one tour before adding calendar events. This ensures your gigs are properly organized.',
        type: 'error'
      });
      return;
    }
    
    setIsFormVisible(true);
  };

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
        {!isFormVisible && (
          <CardHeader className="pb-0 mb-0">
            <CardTitle className="flex justify-between items-center text-3xl font-bold">
              <div className="flex flex-auto tracking-tight text-3xl">
                <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-white text-shadow-sm font-mono font-normal text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                  Booked Gigs
                </span>
              </div>
              <Button 
                onClick={handleAddNewGig}
                className="bg-green-700 text-white hover:bg-green-600"
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Gig
              </Button>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          {!isFormVisible ? (
          <div className="mx-auto max-w-7xl px-0 sm:px-3 lg:px-0 py0">
            <div className="flex justify-center mb-8">
            <Tabs 
              defaultValue="upcoming"
              className="w-full mt-4"
              value={activeTab}
              onValueChange={setActiveTab}

            >
              <div className="flex justify-center">
              <TabsList  className="w-full max-w-lg">
                <TabsTrigger 
                  value="upcoming"
                  className="data-[state=active]:bg-[#111C44] data-[state=active]:text-white text-gray-400 flex-1"
                >
                  Upcoming Gigs
                </TabsTrigger>

                <TabsTrigger 
                  value="past"
                  className="data-[state=active]:bg-[#111C44] data-[state=active]:text-white text-gray-400 flex-1"
                >
                  Past Gigs
                </TabsTrigger>
              </TabsList>
              </div>
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
            </div>
            </div>
          ) : (
            <GigManagement 
              filterType={activeTab as 'upcoming' | 'past'}

              isFormVisible={isFormVisible}
              setIsFormVisible={setIsFormVisible}
            />
          )}
        </CardContent>
      </Card>

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
      />
    </CustomSectionHeader>
  );
}
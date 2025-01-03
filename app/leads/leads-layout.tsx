'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewLeadDialog from './components/forms/new-lead-dialog';
import CustomSectionHeader from '@/components/common/CustomSectionHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import LeadFilters from './components/lead-list/lead-filters';
import LeadList from './components/lead-list/lead-list';
import ActiveLeads from './components/lead-grid/active-leads';

export default function LeadsLayout() {
  return (
    <CustomSectionHeader title="Lead Management" underlineColor="#008ffb">
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
            <div className="flex items-center gap-2">
              <NewLeadDialog>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  New Lead
                </Button>
              </NewLeadDialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="bg-[#192555] border-b border-blue-800">
              <TabsTrigger 
                value="active"
                className="data-[state=active]:bg-blue-600 text-white"
              >
                Active Leads
              </TabsTrigger>
              <TabsTrigger 
                value="upcoming"
                className="data-[state=active]:bg-blue-600 text-white"
              >
                Upcoming Follow-ups
              </TabsTrigger>
              <TabsTrigger 
                value="all"
                className="data-[state=active]:bg-blue-600 text-white"
              >
                All Leads
              </TabsTrigger>
              <TabsTrigger 
                value="search"
                className="data-[state=active]:bg-blue-600 text-white"
              >
                Search
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4">
              <ActiveLeads />
            </TabsContent>
            
            <TabsContent value="upcoming" className="mt-4">
              <div className="grid gap-4">
                {/* Upcoming follow-ups grid/list will go here */}
              </div>
            </TabsContent>
            
            <TabsContent value="all" className="mt-4">
              <div className="grid gap-4">
                <LeadList />
              </div>
            </TabsContent>
            
            <TabsContent value="search" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <LeadFilters />
                </div>
                <div className="lg:col-span-3">
                  <LeadList />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
} 
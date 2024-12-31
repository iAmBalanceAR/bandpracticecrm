'use client';

import { useState, useEffect } from 'react';
import CustomSectionHeader from '@/components/common/CustomSectionHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import VenueSearchMain from '@/components/crm/venues-search-main';
import { useSearchParams, useRouter } from 'next/navigation';
import { VenueSearchFilters } from '@/app/types/venue';
import VenueSearchHeader from '@/components/crm/venue-search-header';
import VenueSearchFiltersComponent from '@/components/crm/venue-search-filters';
import VenueGrid from '@/components/crm/venue-grid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function VenuesPage() {

  return (
    <CustomSectionHeader title="Lead Management" underlineColor="#008ffb">
    <Card className="bg-[#111C44]  min-h-[500px] border-none p-0 m-0">
    <CardHeader className="pb-0 mb-0">
      <CardTitle className="flex justify-between items-center text-3xl font-bold">
        <div className="">
          <div className="flex flex-auto tracking-tight text-3xl">
            <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-white text-shadow-sm font-mono font-normal text-shadow-x-2 text-shadow-y-2 text-shadow-black">
              Leads
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
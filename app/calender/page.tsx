"use client"
import React from "react";
import GigManagement from "@/components/crm/gig-management";
import CustomSectionHeader  from "@/components/common/CustomSectionHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function Page() {
  return (
      <CustomSectionHeader title="Gig Calendar" underlineColor="#D9862F">
        <Card className="bg-[#111C44] border-none p-0 m-0">
        <CardHeader className="pb-0 mb-0">
          <CardTitle className="flex justify-between items-center text-3xl font-bold">
            <div className="">
              <div className="flex flex-auto tracking-tight text-3xl">
                <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-white text-shadow-sm font-mono font-normal text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                  Booked Gigs
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GigManagement />
        </CardContent>
        </Card>
      </CustomSectionHeader>
  );
}
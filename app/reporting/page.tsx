"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ReportBuilder } from "./components/report-builder"
import CustomSectionHeader from "@/components/common/CustomSectionHeader"

export default function ReportingPage() {
  return (
    <CustomSectionHeader title="Report Builder" underlineColor="#008ffb">
      <Card className="bg-[#111C44] min-h-[500px] border-blue-500 p-0 m-0">
        <CardHeader className="pb-0 mb-0">
          <CardTitle className="flex justify-between items-center text-3xl font-bold">
            <div className="">
              <div className="flex flex-auto tracking-tight text-3xl">
                <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-white text-shadow-sm font-mono font-normal text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                  Reports
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500">
                <Plus className="mr-2 h-4 w-4" />
                New Report
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReportBuilder />
        </CardContent>
      </Card>
    </CustomSectionHeader>
  )
} 
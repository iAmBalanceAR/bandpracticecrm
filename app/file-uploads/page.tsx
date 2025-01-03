"use client"
import React from "react";
import FileUploads from "@/components/crm/file-upload-admin";
import CustomSectionHeader from "@/components/common/CustomSectionHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
export default function Page() {
  return (
    <CustomSectionHeader title="File Manager" underlineColor="#ff9920">
    <Card className="bg-[#111C44]  min-h-[500px] border-none p-0 m-0">
    <CardHeader className="pb-0 mb-0">
      <CardTitle className="text-2xl">
        <h1 className="font-mono text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
          Upload Files
        </h1>
        </CardTitle>
    </CardHeader>
    <CardContent>
      <FileUploads />
    </CardContent>
    </Card>
    </CustomSectionHeader>
  );
}
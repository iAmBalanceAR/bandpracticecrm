
"use client"

import CustomSectionHeader from '@/components/common/CustomSectionHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function StatusPage() {
  return (
    <CustomSectionHeader title="System Status" underlineColor="#D83B34">
      <Card className="bg-[#111C44] min-h-[500px] border-none">
        <CardContent className="p-6">
        <iframe src="https://bandpracticecrm1.statuspage.io/" className="w-full h-[2000px] border-none"></iframe>
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
} 
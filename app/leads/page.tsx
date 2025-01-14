import { Metadata } from 'next';
import LeadsDataView from '@/app/leads/components/leads-data-view';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import LeadDialog from './components/forms/lead-dialog';
import CustomSectionHeader from '@/components/common/CustomSectionHeader';

export const metadata: Metadata = {
  title: 'Lead Management',
  description: 'Manage and track your leads effectively',
};

export default function LeadsPage() {
  return (
    <CustomSectionHeader title="Lead Management" underlineColor="#D83B34">
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
            <div className="flex items-center gap-2 mb-4">
              <LeadDialog>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-0  h-6 w-6" />
                  New Lead
                </Button>
              </LeadDialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeadsDataView />
        </CardContent>
      </Card>
    </CustomSectionHeader>
  );
} 
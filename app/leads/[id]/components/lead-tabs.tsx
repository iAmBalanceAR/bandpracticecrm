'use client';

import { Lead, Communication, Reminder, LeadNote, Attachment } from '@/app/types/lead';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import LeadOverview from './tabs/lead-overview';
import LeadCommunications from '@/app/leads/[id]/components/tabs/lead-communications';
import LeadReminders from '@/app/leads/[id]/components/tabs/lead-reminders';
import LeadNotes from '@/app/leads/[id]/components/tabs/lead-notes';
import LeadAttachments from '@/app/leads/[id]/components/tabs/lead-attachments';

interface LeadTabsProps {
  lead: Lead & {
    communications: Communication[];
    reminders: Reminder[];
    lead_notes: LeadNote[];
    attachments: Attachment[];
  };
}

export default function LeadTabs({ lead }: LeadTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="communications">
          Communications ({lead.communications.length})
        </TabsTrigger>
        <TabsTrigger value="reminders">
          Reminders ({lead.reminders.length})
        </TabsTrigger>
        <TabsTrigger value="notes">
          Notes ({lead.lead_notes.length})
        </TabsTrigger>
        <TabsTrigger value="attachments">
          Attachments ({lead.attachments.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <Card>
          <LeadOverview lead={lead} />
        </Card>
      </TabsContent>

      <TabsContent value="communications">
        <Card>
          <LeadCommunications lead={lead} />
        </Card>
      </TabsContent>

      <TabsContent value="reminders">
        <Card>
          <LeadReminders lead={lead} />
        </Card>
      </TabsContent>

      <TabsContent value="notes">
        <Card>
          <LeadNotes lead={lead} />
        </Card>
      </TabsContent>

      <TabsContent value="attachments">
        <Card>
          <LeadAttachments lead={lead} />
        </Card>
      </TabsContent>
    </Tabs>
  );
} 
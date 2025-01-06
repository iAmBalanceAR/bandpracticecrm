'use client';

import { Lead } from '@/app/types/lead';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface LeadOverviewProps {
  lead: Lead & {
    communications: any[];
    reminders: any[];
    lead_notes: any[];
    attachments: any[];
  };
}

export default function LeadOverview({ lead }: LeadOverviewProps) {
  return (
    <CardContent className="space-y-6  p-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Description</h3>
        <p className="text-muted-foreground">
          {lead.description || 'No description provided.'}
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Details</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Type</dt>
            <dd className="mt-1">{lead.type}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Company</dt>
            <dd className="mt-1">{lead.company || 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Last Contact</dt>
            <dd className="mt-1">
              {formatDistanceToNow(new Date(lead.last_contact_date), { addSuffix: true })}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Next Follow-up</dt>
            <dd className="mt-1">
              {lead.next_follow_up
                ? formatDistanceToNow(new Date(lead.next_follow_up), { addSuffix: true })
                : 'Not scheduled'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Expected Value</dt>
            <dd className="mt-1">
              {lead.expected_value
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(lead.expected_value)
                : 'Not specified'}
            </dd>
          </div>
        </dl>
      </div>

      {lead.tags?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {lead.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-2">Activity Summary</h3>
        <dl className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg ">
            <dt className="text-sm font-medium text-muted-foreground ">Communications</dt>
            <dd className="mt-1 text-2xl font-semibold">{lead.communications.length}</dd>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <dt className="text-sm font-medium text-muted-foreground">Reminders</dt>
            <dd className="mt-1 text-2xl font-semibold">{lead.reminders.length}</dd>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <dt className="text-sm font-medium text-muted-foreground">Notes</dt>
            <dd className="mt-1 text-2xl font-semibold">{lead.lead_notes.length}</dd>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <dt className="text-sm font-medium text-muted-foreground">Attachments</dt>
            <dd className="mt-1 text-2xl font-semibold">{lead.attachments.length}</dd>
          </div>
        </dl>
      </div>
    </CardContent>
  );
} 
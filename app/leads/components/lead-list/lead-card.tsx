'use client';

import { Lead } from '@/app/types/lead';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Building2, User2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface LeadCardProps {
  lead: Lead;
}

const statusColors = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  in_progress: 'bg-purple-500',
  negotiating: 'bg-orange-500',
  won: 'bg-green-500',
  lost: 'bg-red-500',
  archived: 'bg-gray-500'
} as const;

const priorityColors = {
  low: 'bg-blue-200 text-blue-700',
  medium: 'bg-yellow-200 text-yellow-700',
  high: 'bg-red-200 text-red-700'
} as const;

export default function LeadCard({ lead }: LeadCardProps) {
  return (
    <Link href={`/leads/${lead.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer ">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{lead.title}</h3>
              {lead.company && (
                <div className="flex items-center text-muted-foreground text-sm mt-1">
                  <Building2 className="h-4 w-4 mr-1" />
                  {lead.company}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className={priorityColors[lead.priority]}>
                {lead.priority}
              </Badge>
              <Badge className={statusColors[lead.status]}>
                {lead.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <User2 className="h-4 w-4 mr-1" />
                {lead.contact_info.name || 'No contact'}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Last contact: {formatDistanceToNow(new Date(lead.last_contact_date), { addSuffix: true })}
              </div>
            </div>
            {lead.tags.length > 0 && (
              <div className="flex gap-1">
                {lead.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {lead.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{lead.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
} 
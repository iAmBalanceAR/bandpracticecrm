'use client';

import { useState } from 'react';
import { Lead, Communication } from '@/app/types/lead';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import createClient from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Mail, Phone, MessageSquare, Calendar } from 'lucide-react';

interface LeadCommunicationsProps {
  lead: Lead & {
    communications: Communication[];
  };
}

const communicationIcons = {
  email: <Mail className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
  note: <MessageSquare className="h-4 w-4" />,
};

export default function LeadCommunications({ lead }: LeadCommunicationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      lead_id: lead.id,
      type: formData.get('type') as Communication['type'],
      content: formData.get('content') as string,
      date: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('communications')
        .insert([data]);

      if (error) throw error;

      // Update last_contact_date on the lead
      await supabase
        .from('leads')
        .update({ last_contact_date: data.date })
        .eq('id', lead.id);

      toast.success('Communication added successfully');
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error adding communication:', error);
      toast.error('Failed to add communication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Communications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" required defaultValue="note">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                placeholder="Add details about the communication..."
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Communication'}
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          {lead.communications.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No communications yet. Add your first communication above.
            </p>
          ) : (
            lead.communications
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((communication) => (
                <div
                  key={communication.id}
                  className="flex gap-4 p-4 border rounded-lg"
                >
                  <div className="mt-1">
                    {communicationIcons[communication.type]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium capitalize">
                        {communication.type}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(communication.date), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {communication.content}
                    </p>
                  </div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </>
  );
} 
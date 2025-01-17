import { Database } from '@/types/supabase';

export type LeadType = 'venue' | 'artist' | 'promoter' | 'sponsor' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'in_progress' | 'negotiating' | 'won' | 'lost' | 'archived';
export type LeadPriority = 'low' | 'medium' | 'high';

export interface Lead {
  id: string;
  title: string;
  type: LeadType;
  status: LeadStatus;
  priority: LeadPriority;
  company: string | null;
  description: string | null;
  venue_id: string | null;
  contact_info: {
    website: any;
    name: string;
    email: string;
    phone: string;
  };
  tags: string[];
  next_follow_up: string | null;
  expected_value: number | null;
  created_by: string;
  created_by_email: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  last_contact_date: string;
  lead_notes: LeadNote[];
  reminders: LeadReminder[];
  communications: LeadCommunication[];
  attachments: Attachment[];
}

export interface LeadNote {
  id: string;
  lead_id: string;
  content: string;
  created_by: string;
  created_by_email: string;
  created_at: string;
}

export interface LeadReminder {
  id: string;
  lead_id: string;
  title: string;
  description: string | null;
  due_date: string;
  completed: boolean;
  created_by: string;
  created_by_email: string;
  created_at: string;
}

export interface LeadCommunication {
  id: string;
  lead_id: string;
  type: string;
  content: string;
  date: string;
  sentiment: string | null;
  user_id: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  lead_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  type: 'document' | 'contract' | 'rider' | 'image' | 'other';
  uploaded_at: string;
  file_path?: string;
}

export interface LeadFilters {
  query: string;
  status: string[];
  priority: LeadPriority[];
  type: LeadType[];
  assignedTo: string[];
  tags: string[];
  dateRange?: DateRange;
}

export interface DateRange {
  from?: Date;
  to?: Date;
} 
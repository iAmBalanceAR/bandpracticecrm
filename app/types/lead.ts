import { Database } from '@/types/supabase';

export type LeadStatus = 'new' | 'contacted' | 'in_progress' | 'negotiating' | 'won' | 'lost' | 'archived';
export type LeadPriority = 'low' | 'medium' | 'high';
export type LeadType = 'venue' | 'artist' | 'promoter' | 'sponsor' | 'other';
export type CommunicationType = 'email' | 'call' | 'meeting' | 'note';

export interface Lead {
  id: string;
  title: string;
  type: LeadType;
  status: LeadStatus;
  priority: LeadPriority;
  assigned_to: string; // user_id
  company?: string;
  contact_info: {
    name?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  venue_id?: string; // Reference to venues table
  description?: string;
  expected_value?: number;
  last_contact_date: string;
  next_follow_up?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Communication {
  id: string;
  lead_id: string;
  type: CommunicationType;
  content: string;
  date: string;
  user_id: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  lead_id: string;
  communication_id?: string;
  type: 'document' | 'contract' | 'rider' | 'image' | 'other';
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface Reminder {
  id: string;
  lead_id: string;
  title: string;
  description?: string;
  due_date: string;
  status: 'pending' | 'completed';
  priority: LeadPriority;
  assigned_to: string;
  created_by: string;
  created_at: string;
  completed_at?: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_private: boolean;
}

export interface LeadFilters {
  query?: string;
  status?: LeadStatus[];
  priority?: LeadPriority[];
  type?: LeadType[];
  assignedTo?: string[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
} 
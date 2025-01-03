-- Drop existing policies for lead_notes
drop policy if exists "Users can view their own lead notes" on lead_notes;
drop policy if exists "Users can insert their own lead notes" on lead_notes;
drop policy if exists "Users can update their own lead notes" on lead_notes;
drop policy if exists "Users can delete their own lead notes" on lead_notes;

-- Drop existing policies for reminders
drop policy if exists "Users can view their own reminders" on reminders;
drop policy if exists "Users can insert their own reminders" on reminders;
drop policy if exists "Users can update their own reminders" on reminders;
drop policy if exists "Users can delete their own reminders" on reminders;

-- Create lead_notes table if it doesn't exist
create table if not exists lead_notes (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references leads(id) on delete cascade not null,
  content text not null,
  is_private boolean default false,
  created_by_email text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create reminders table if it doesn't exist
create table if not exists reminders (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references leads(id) on delete cascade not null,
  title text not null,
  description text,
  due_date timestamp with time zone not null,
  status text check (status in ('pending', 'completed')) default 'pending',
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  created_by_email text not null,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

-- Enable RLS
alter table lead_notes enable row level security;
alter table reminders enable row level security;

-- Create policies for lead_notes
create policy "Users can view their own lead notes"
  on lead_notes for select
  using (auth.jwt() ->> 'email' = created_by_email);

create policy "Users can insert their own lead notes"
  on lead_notes for insert
  with check (auth.jwt() ->> 'email' = created_by_email);

create policy "Users can update their own lead notes"
  on lead_notes for update
  using (auth.jwt() ->> 'email' = created_by_email);

create policy "Users can delete their own lead notes"
  on lead_notes for delete
  using (auth.jwt() ->> 'email' = created_by_email);

-- Create policies for reminders
create policy "Users can view their own reminders"
  on reminders for select
  using (auth.jwt() ->> 'email' = created_by_email);

create policy "Users can insert their own reminders"
  on reminders for insert
  with check (auth.jwt() ->> 'email' = created_by_email);

create policy "Users can update their own reminders"
  on reminders for update
  using (auth.jwt() ->> 'email' = created_by_email);

create policy "Users can delete their own reminders"
  on reminders for delete
  using (auth.jwt() ->> 'email' = created_by_email);

-- Create indexes
create index if not exists lead_notes_lead_id_idx on lead_notes(lead_id);
create index if not exists lead_notes_created_by_email_idx on lead_notes(created_by_email);
create index if not exists reminders_lead_id_idx on reminders(lead_id);
create index if not exists reminders_created_by_email_idx on reminders(created_by_email);
create index if not exists reminders_due_date_idx on reminders(due_date);
create index if not exists reminders_status_idx on reminders(status); 
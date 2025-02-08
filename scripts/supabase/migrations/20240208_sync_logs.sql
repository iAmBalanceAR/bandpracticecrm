-- Create sync_logs table
create table if not exists public.sync_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  type text not null,
  status text not null,
  details jsonb,
  
  constraint sync_logs_status_check check (status in ('started', 'processing', 'completed', 'error', 'success'))
);

-- Add RLS policies
alter table public.sync_logs enable row level security;

create policy "Allow service role full access to sync_logs"
  on public.sync_logs
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

-- Add indexes
create index sync_logs_type_idx on public.sync_logs (type);
create index sync_logs_status_idx on public.sync_logs (status);
create index sync_logs_created_at_idx on public.sync_logs (created_at desc); 
-- Drop types if they exist
do $$ begin
    create type lead_status as enum ('new', 'contacted', 'in_progress', 'negotiating', 'won', 'lost', 'archived');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type lead_priority as enum ('low', 'medium', 'high');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type lead_type as enum ('venue', 'artist', 'promoter', 'sponsor', 'other');
exception
    when duplicate_object then null;
end $$;

-- Create leads table
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type lead_type not null,
  status lead_status not null default 'new',
  priority lead_priority not null default 'medium',
  company text,
  description text,
  venue_id uuid references venues(id) on delete set null,
  contact_info jsonb not null default '{}'::jsonb,
  tags text[] default array[]::text[],
  last_contact_date timestamp with time zone not null default now(),
  next_follow_up timestamp with time zone,
  expected_value decimal(10,2),
  created_by text not null,
  created_by_email text not null,
  assigned_to text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.leads enable row level security;

-- Drop existing policies
drop policy if exists "Users can view their own leads" on leads;
drop policy if exists "Users can insert their own leads" on leads;
drop policy if exists "Users can update their own leads" on leads;
drop policy if exists "Users can delete their own leads" on leads;

-- Create policies
create policy "Users can view their own leads"
  on leads for select
  using (auth.jwt() ->> 'sub' = created_by);

create policy "Users can insert their own leads"
  on leads for insert
  with check (auth.jwt() ->> 'sub' = created_by);

create policy "Users can update their own leads"
  on leads for update
  using (auth.jwt() ->> 'sub' = created_by);

create policy "Users can delete their own leads"
  on leads for delete
  using (auth.jwt() ->> 'sub' = created_by);

-- Create indexes
create index if not exists leads_created_by_idx on leads(created_by);
create index if not exists leads_status_idx on leads(status);
create index if not exists leads_type_idx on leads(type);
create index if not exists leads_venue_id_idx on leads(venue_id);

-- Drop existing trigger and function
drop trigger if exists handle_leads_updated_at on leads;
drop function if exists handle_updated_at() cascade;

-- Create updated_at function if it doesn't exist
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create trigger
create trigger handle_leads_updated_at
  before update on leads
  for each row
  execute function public.handle_updated_at();

-- Drop existing functions
drop function if exists create_lead(jsonb);
drop function if exists create_lead(json);

-- Create function to create a lead
create or replace function create_lead(lead_data jsonb)
returns leads
language plpgsql
security definer
set search_path = public
as $$
declare
  new_lead leads;
  v_venue_id uuid;
  v_tags text[];
  v_session_id text;
begin
  -- Get the session ID
  v_session_id := auth.jwt() ->> 'sub';
  if v_session_id is null then
    raise exception 'Session ID not found';
  end if;

  -- Try to convert venue_id to UUID if it exists
  begin
    if lead_data->>'venue_id' is not null then
      v_venue_id := (lead_data->>'venue_id')::uuid;
    end if;
  exception when others then
    v_venue_id := null;
  end;

  -- Handle tags
  if lead_data ? 'tags' and jsonb_typeof(lead_data->'tags') = 'array' then
    select array_agg(x.value::text)
    into v_tags
    from jsonb_array_elements_text(lead_data->'tags') as x(value);
  else
    v_tags := array[]::text[];
  end if;

  insert into leads (
    title,
    type,
    status,
    priority,
    company,
    description,
    venue_id,
    contact_info,
    tags,
    last_contact_date,
    next_follow_up,
    expected_value,
    created_by,
    created_by_email
  )
  values (
    lead_data->>'title',
    (lead_data->>'type')::lead_type,
    (lead_data->>'status')::lead_status,
    (lead_data->>'priority')::lead_priority,
    lead_data->>'company',
    lead_data->>'description',
    v_venue_id,
    (lead_data->'contact_info')::jsonb,
    v_tags,
    coalesce((lead_data->>'last_contact_date')::timestamp with time zone, now()),
    (lead_data->>'next_follow_up')::timestamp with time zone,
    (lead_data->>'expected_value')::decimal(10,2),
    v_session_id,
    v_session_id
  )
  returning * into new_lead;

  return new_lead;
end;
$$; 
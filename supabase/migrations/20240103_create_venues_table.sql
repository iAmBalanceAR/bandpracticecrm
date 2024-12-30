-- Create the venues table
create table if not exists public.venues (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  venue_type text,
  capacity integer,
  city text not null,
  state text not null,
  address text,
  zip text,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  notes text,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.venues enable row level security;

-- Create policies
create policy "Users can view their own venues"
on public.venues for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own venues"
on public.venues for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own venues"
on public.venues for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own venues"
on public.venues for delete
to authenticated
using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger handle_venues_updated_at
  before update on public.venues
  for each row
  execute function public.handle_updated_at(); 
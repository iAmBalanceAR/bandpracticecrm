-- Create the tours table
create table if not exists public.tours (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_default boolean default false,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.tours enable row level security;

-- Create policies
create policy "Users can view their own tours"
on public.tours for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own tours"
on public.tours for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own tours"
on public.tours for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own tours"
on public.tours for delete
to authenticated
using (auth.uid() = user_id); 
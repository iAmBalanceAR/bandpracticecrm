-- Create an enum for gig status
create type gig_status as enum ('pending', 'confirmed', 'completed', 'cancelled');

-- Create the gigs table
create table gigs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) not null,
  
  -- Basic gig info
  title text not null,
  gig_status gig_status default 'pending',
  gig_date date not null,
  gig_details text,
  
  -- Venue information
  venue text not null,
  venue_address text not null,
  venue_city text not null,
  venue_state text not null,
  venue_zip text not null,
  
  -- Contact information
  contact_name text not null,
  contact_email text,
  contact_phone text,
  
  -- Times
  load_in_time time not null,
  sound_check_time time not null,
  set_time time not null,
  set_length text not null,
  
  -- Crew and amenities
  crew_hands_in boolean default false,
  crew_hands_out boolean default false,
  meal_included boolean default false,
  hotel_included boolean default false,
  
  -- Financial information
  deposit_amount decimal(10,2) not null default 0,
  deposit_paid boolean default false,
  contract_total decimal(10,2) not null default 0,
  open_balance decimal(10,2) not null default 0
);

-- Enable RLS
alter table gigs enable row level security;

-- Create RLS policies
create policy "Users can view their own gigs"
  on gigs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own gigs"
  on gigs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own gigs"
  on gigs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own gigs"
  on gigs for delete
  using (auth.uid() = user_id);

-- Create indexes
create index gigs_user_id_idx on gigs(user_id);
create index gigs_gig_date_idx on gigs(gig_date);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_gigs_updated_at
  before update on gigs
  for each row
  execute function update_updated_at_column(); 
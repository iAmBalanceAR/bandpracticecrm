-- Drop existing objects if they exist
drop function if exists get_tour_by_id(bigint);
drop function if exists update_tour(bigint,text,text,text,timestamp with time zone,timestamp with time zone,tour_status);
drop function if exists delete_tour(bigint);
drop function if exists update_tour(bigint, jsonb);
drop function if exists create_tour(jsonb);
drop function if exists get_user_tours();
drop function if exists update_last_updated_column() cascade;
drop trigger if exists update_tours_last_updated on tours;
drop table if exists tours cascade;
drop type if exists tour_status;

-- Create an enum for tour status
create type tour_status as enum ('Building', 'In Progress', 'Closed');

-- Create function to update last_updated column
create or replace function update_last_updated_column()
returns trigger as $$
begin
  new.last_updated = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create the tours table
create table tours (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) not null,
  
  -- Basic tour info
  title text not null,
  description text,
  thumbnail text,
  status tour_status default 'Building',
  departure_date date,
  return_date date,
  is_default boolean default false,
  session_id uuid default gen_random_uuid()
);

-- Create tourconnect table
create table tourconnect (
  id bigint generated always as identity primary key,
  tour_id bigint references tours(id) on delete cascade not null,
  gig_id uuid references gigs(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) not null,
  unique(tour_id, gig_id)
);

-- Enable RLS for tourconnect
alter table tourconnect enable row level security;

-- Create RLS policies for tourconnect
create policy "Users can view their own tour connections"
  on tourconnect for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tour connections"
  on tourconnect for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tour connections"
  on tourconnect for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tour connections"
  on tourconnect for delete
  using (auth.uid() = user_id);

-- Create indexes for tourconnect
create index tourconnect_tour_id_idx on tourconnect(tour_id);
create index tourconnect_gig_id_idx on tourconnect(gig_id);
create index tourconnect_user_id_idx on tourconnect(user_id);

-- Function to set default tour
create or replace function set_default_tour(p_tour_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- First, unset any existing default tour for this user
  update tours
  set is_default = false
  where user_id = auth.uid()
    and is_default = true;
    
  -- Then set the new default tour
  update tours
  set is_default = true
  where id = p_tour_id
    and user_id = auth.uid();
    
  if not found then
    raise exception 'Tour not found or you do not have permission to update it';
  end if;
end;
$$;

-- Function to get default tour
create or replace function get_default_tour()
returns tours
language plpgsql
security definer
set search_path = public
as $$
declare
  default_tour tours;
begin
  select *
  into default_tour
  from tours
  where user_id = auth.uid()
    and is_default = true
  limit 1;
  
  return default_tour;
end;
$$;

-- Function to connect gig to default tour
create or replace function connect_gig_to_default_tour(p_gig_id uuid)
returns tourconnect
language plpgsql
security definer
set search_path = public
as $$
declare
  default_tour tours;
  new_connection tourconnect;
begin
  -- Get the default tour
  select *
  into default_tour
  from tours
  where user_id = auth.uid()
    and is_default = true
  limit 1;
  
  if default_tour is null then
    return null; -- No default tour set
  end if;
  
  -- Create the connection
  insert into tourconnect (tour_id, gig_id, user_id)
  values (default_tour.id, p_gig_id, auth.uid())
  returning * into new_connection;
  
  return new_connection;
end;
$$;

-- Enable RLS
alter table tours enable row level security;

-- Create RLS policies
create policy "Users can view their own tours"
  on tours for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tours"
  on tours for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tours"
  on tours for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tours"
  on tours for delete
  using (auth.uid() = user_id);

-- Create indexes
create index tours_user_id_idx on tours(user_id);
create index tours_departure_date_idx on tours(departure_date);
create index tours_return_date_idx on tours(return_date);

-- Create last_updated trigger
create trigger update_tours_last_updated
  before update on tours
  for each row
  execute function update_last_updated_column();

-- Create function to get user's tours
create or replace function get_user_tours()
returns setof tours
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select *
  from tours
  where user_id = auth.uid()
  order by departure_date desc nulls last;
end;
$$;

-- Create function to create a tour
create or replace function create_tour(tour_data jsonb)
returns tours
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tour tours;
begin
  insert into tours (
    user_id,
    title,
    description,
    departure_date,
    return_date,
    status
  )
  values (
    auth.uid(),
    tour_data->>'title',
    tour_data->>'description',
    (tour_data->>'departure_date')::date,
    (tour_data->>'return_date')::date,
    (tour_data->>'status')::tour_status
  )
  returning * into new_tour;

  return new_tour;
end;
$$;

-- Create function to update a tour
create or replace function update_tour(tour_id bigint, tour_data jsonb)
returns tours
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_tour tours;
begin
  update tours
  set
    title = tour_data->>'title',
    description = tour_data->>'description',
    departure_date = (tour_data->>'departure_date')::date,
    return_date = (tour_data->>'return_date')::date,
    status = (tour_data->>'status')::tour_status
  where id = tour_id
    and user_id = auth.uid()
  returning * into updated_tour;

  if updated_tour is null then
    raise exception 'Tour not found or you do not have permission to update it';
  end if;

  return updated_tour;
end;
$$;

-- Create function to delete a tour
create or replace function delete_tour(tour_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from tours
  where id = tour_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Tour not found or you do not have permission to delete it';
  end if;
end;
$$;

-- Function to connect all existing gigs to default tour
create or replace function connect_existing_gigs_to_default_tour()
returns setof tourconnect
language plpgsql
security definer
set search_path = public
as $$
declare
  default_tour tours;
  gig_record record;
  new_connection tourconnect;
begin
  -- Get the default tour
  select *
  into default_tour
  from tours
  where user_id = auth.uid()
    and is_default = true
  limit 1;
  
  if default_tour is null then
    return; -- No default tour set
  end if;
  
  -- Loop through all gigs that aren't connected to any tour yet
  for gig_record in (
    select g.id as gig_id
    from gigs g
    left join tourconnect tc on g.id = tc.gig_id
    where g.user_id = auth.uid()
      and tc.id is null
  ) loop
    -- Create connection for each gig
    insert into tourconnect (tour_id, gig_id, user_id)
    values (default_tour.id, gig_record.gig_id, auth.uid())
    returning * into new_connection;
    
    return next new_connection;
  end loop;
  
  return;
end;
$$; 
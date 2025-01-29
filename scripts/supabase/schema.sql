-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  stripe_customer_id text,
  subscription_status text check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  subscription_price_id text,
  subscription_id text,
  primary key (id)
);

-- Create gigs table
create table gigs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  venue text,
  venue_address text,
  venue_city text,
  venue_state text,
  venue_zip text,
  contact_name text,
  contact_email text,
  contact_phone text,
  gig_date date not null,
  load_in_time time,
  set_time time,
  set_length text,
  gig_details text,
  meal_included boolean default false,
  hotel_included boolean default false,
  deposit_amount decimal(10,2),
  deposit_paid boolean default false,
  total_payout decimal(10,2),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on gigs table
alter table gigs enable row level security;

-- Create policy to allow users to view their own gigs
create policy "Users can view own gigs"
  on gigs for select
  using (auth.uid() = user_id);

-- Create policy to allow users to insert their own gigs
create policy "Users can insert own gigs"
  on gigs for insert
  with check (auth.uid() = user_id);

-- Create policy to allow users to update their own gigs
create policy "Users can update own gigs"
  on gigs for update
  using (auth.uid() = user_id);

-- Create policy to allow users to delete their own gigs
create policy "Users can delete own gigs"
  on gigs for delete
  using (auth.uid() = user_id);

-- Create products table
create table products (
  id text primary key,
  active boolean,
  name text,
  description text,
  image text,
  metadata jsonb,
  created timestamp with time zone default timezone('utc'::text, now()),
  updated timestamp with time zone default timezone('utc'::text, now())
);

-- Create prices table
create table prices (
  id text primary key,
  product_id text references products(id),
  active boolean,
  description text,
  unit_amount bigint,
  currency text,
  type text check (type in ('one_time', 'recurring')),
  interval text check (interval in ('day', 'week', 'month', 'year')),
  interval_count integer,
  trial_period_days integer,
  metadata jsonb,
  created timestamp with time zone default timezone('utc'::text, now()),
  updated timestamp with time zone default timezone('utc'::text, now())
);

-- Create subscriptions table
create table subscriptions (
  id text primary key,
  user_id uuid references auth.users not null,
  status text check (status in ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  metadata jsonb,
  price_id text references prices(id),
  quantity integer,
  cancel_at_period_end boolean,
  created timestamp with time zone default timezone('utc'::text, now()),
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  ended_at timestamp with time zone,
  cancel_at timestamp with time zone,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table products enable row level security;
alter table prices enable row level security;
alter table subscriptions enable row level security;

-- Create security policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Products and prices are viewable by everyone
create policy "Products are viewable by everyone."
  on products for select
  using ( true );

create policy "Prices are viewable by everyone."
  on prices for select
  using ( true );

-- Subscriptions policies
create policy "Users can view own subscriptions."
  on subscriptions for select
  using ( auth.uid() = user_id );

-- Create a trigger to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, stripe_customer_id)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'stripe_customer_id'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 
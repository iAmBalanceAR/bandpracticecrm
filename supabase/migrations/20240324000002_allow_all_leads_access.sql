-- Drop existing policies
drop policy if exists "Users can view their own leads" on leads;
drop policy if exists "Users can insert their own leads" on leads;
drop policy if exists "Users can update their own leads" on leads;
drop policy if exists "Users can delete their own leads" on leads;

-- Create a policy that allows all selects
create policy "Allow all selects on leads"
  on leads for select
  using (true);

-- Create a policy that allows all inserts
create policy "Allow all inserts on leads"
  on leads for insert
  with check (true);

-- Create a policy that allows all updates
create policy "Allow all updates on leads"
  on leads for update
  using (true);

-- Create a policy that allows all deletes
create policy "Allow all deletes on leads"
  on leads for delete
  using (true); 
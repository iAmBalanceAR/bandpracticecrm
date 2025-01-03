-- Drop existing RLS policies
drop policy if exists "Users can view their own leads" on leads;
drop policy if exists "Users can insert their own leads" on leads;
drop policy if exists "Users can update their own leads" on leads;
drop policy if exists "Users can delete their own leads" on leads;

-- Create new RLS policies using auth.uid()
create policy "Users can view their own leads"
  on leads for select
  using (auth.uid()::text = created_by_email);

create policy "Users can insert their own leads"
  on leads for insert
  with check (auth.uid()::text = created_by_email);

create policy "Users can update their own leads"
  on leads for update
  using (auth.uid()::text = created_by_email);

create policy "Users can delete their own leads"
  on leads for delete
  using (auth.uid()::text = created_by_email);

-- Add user_id column if it doesn't exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns 
    where table_name = 'leads' and column_name = 'user_id') then
    alter table leads add column user_id uuid references auth.users(id);
    
    -- Update existing rows to set user_id based on created_by_email
    update leads
    set user_id = (
      select id from auth.users where email = leads.created_by_email
    );
    
    -- Make user_id not null for future rows
    alter table leads alter column user_id set not null;
  end if;
end $$; 
-- Drop existing RLS policies
drop policy if exists "Users can view their own leads" on leads;
drop policy if exists "Users can insert their own leads" on leads;
drop policy if exists "Users can update their own leads" on leads;
drop policy if exists "Users can delete their own leads" on leads;

-- Create new RLS policies using email
create policy "Users can view their own leads"
  on leads for select
  using (auth.jwt() ->> 'email' = created_by_email);

create policy "Users can insert their own leads"
  on leads for insert
  with check (auth.jwt() ->> 'email' = created_by_email);

create policy "Users can update their own leads"
  on leads for update
  using (auth.jwt() ->> 'email' = created_by_email);

create policy "Users can delete their own leads"
  on leads for delete
  using (auth.jwt() ->> 'email' = created_by_email);

-- Drop the user_id column if it exists
do $$ 
begin
  if exists (select 1 from information_schema.columns 
    where table_name = 'leads' and column_name = 'user_id') then
    alter table leads drop column user_id;
  end if;
end $$; 
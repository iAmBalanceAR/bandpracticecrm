-- Drop all policies
drop policy if exists "Users can view their own leads" on leads;
drop policy if exists "Users can insert their own leads" on leads;
drop policy if exists "Users can update their own leads" on leads;
drop policy if exists "Users can delete their own leads" on leads;

-- Disable RLS
alter table leads disable row level security; 
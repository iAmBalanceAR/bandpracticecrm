-- Drop existing policies
drop policy if exists "Users can view their own leads" on leads;
drop policy if exists "Users can insert their own leads" on leads;
drop policy if exists "Users can update their own leads" on leads;
drop policy if exists "Users can delete their own leads" on leads;

-- Create policies using session ID
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

-- Drop and recreate the create_lead function
drop function if exists create_lead(jsonb);
drop function if exists create_lead(json);

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
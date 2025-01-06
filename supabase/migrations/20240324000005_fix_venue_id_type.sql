-- Fix venue_id type in leads table
ALTER TABLE leads ALTER COLUMN venue_id TYPE TEXT;

-- Drop existing functions
DROP FUNCTION IF EXISTS create_lead(jsonb);
DROP FUNCTION IF EXISTS update_lead(uuid, jsonb);

-- Recreate create_lead function with TEXT venue_id
CREATE OR REPLACE FUNCTION create_lead(lead_data jsonb)
RETURNS leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_lead leads;
  v_tags text[];
  v_session_id text;
BEGIN
  -- Get the session ID
  v_session_id := auth.jwt() ->> 'sub';
  if v_session_id is null then
    raise exception 'Session ID not found';
  end if;

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
    lead_data->>'venue_id',
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

-- Recreate update_lead function with TEXT venue_id
CREATE OR REPLACE FUNCTION update_lead(p_lead_id uuid, lead_data jsonb)
RETURNS leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_lead leads;
  v_tags text[];
  v_session_id text;
BEGIN
  -- Get the session ID
  v_session_id := auth.jwt() ->> 'sub';
  if v_session_id is null then
    raise exception 'Session ID not found';
  end if;

  -- Handle tags
  if lead_data ? 'tags' and jsonb_typeof(lead_data->'tags') = 'array' then
    select array_agg(x.value::text)
    into v_tags
    from jsonb_array_elements_text(lead_data->'tags') as x(value);
  else
    v_tags := array[]::text[];
  end if;

  update leads
  set
    title = lead_data->>'title',
    type = (lead_data->>'type')::lead_type,
    status = (lead_data->>'status')::lead_status,
    priority = (lead_data->>'priority')::lead_priority,
    company = lead_data->>'company',
    description = lead_data->>'description',
    venue_id = lead_data->>'venue_id',
    contact_info = (lead_data->'contact_info')::jsonb,
    tags = v_tags,
    last_contact_date = coalesce((lead_data->>'last_contact_date')::timestamp with time zone, now()),
    next_follow_up = (lead_data->>'next_follow_up')::timestamp with time zone,
    expected_value = (lead_data->>'expected_value')::decimal(10,2),
    updated_at = now()
  where id = p_lead_id
  and created_by = v_session_id
  returning * into updated_lead;

  if not found then
    raise exception 'Lead not found or permission denied';
  end if;

  return updated_lead;
end;
$$; 
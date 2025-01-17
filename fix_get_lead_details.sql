CREATE OR REPLACE FUNCTION public.get_lead_with_details(p_lead_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_result json;
  v_lead leads;
  v_venue json;
  v_venue_types text[];
  v_hashtags text[];
BEGIN
  -- Get the authenticated user's ID and email
  v_user_id := auth.uid();
  v_user_email := auth.jwt()->>'email';
  
  -- First get the lead record directly to preserve empty strings
  SELECT *
  INTO v_lead
  FROM leads
  WHERE id = p_lead_id
    AND (created_by = v_user_id OR assigned_to = v_user_id);

  -- Get venue data if venue_id exists
  IF v_lead.venue_id IS NOT NULL THEN
    -- Split venue types into array and convert to hashtags
    WITH venue_data AS (
      SELECT 
        title,
        NULLIF(NULLIF(address, ''), 'null') as address,
        NULLIF(NULLIF(address2, ''), 'null') as address2,
        NULLIF(NULLIF(city, ''), 'null') as city,
        NULLIF(NULLIF(state, ''), 'null') as state,
        NULLIF(NULLIF(zip, ''), 'null') as zip,
        NULLIF(NULLIF(phone, ''), 'null') as phone,
        NULLIF(NULLIF(website, ''), 'null') as website,
        capacity,
        string_to_array(COALESCE(venuetype, ''), ',') as venue_types
      FROM venues 
      WHERE id::text = v_lead.venue_id
    )
    SELECT 
      json_build_object(
        'title', title,
        'address', address,
        'address2', address2,
        'city', city,
        'state', state,
        'zip', zip,
        'phone', phone,
        'website', website,
        'capacity', capacity,
        'venue_types', (
          SELECT array_agg('#' || trim(type))
          FROM unnest(venue_types) as type
          WHERE trim(type) != ''
        )
      )
    INTO v_venue
    FROM venue_data;
  END IF;
  
  -- Then get related records
  WITH related_data AS (
    SELECT 
      COALESCE(json_agg(ln.*) FILTER (WHERE ln.id IS NOT NULL), '[]'::json) AS lead_notes,
      COALESCE(json_agg(r.*) FILTER (WHERE r.id IS NOT NULL), '[]'::json) AS reminders,
      COALESCE(json_agg(c.*) FILTER (WHERE c.id IS NOT NULL), '[]'::json) AS communications,
      COALESCE(json_agg(a.*) FILTER (WHERE a.id IS NOT NULL), '[]'::json) AS attachments
    FROM leads l
    LEFT JOIN lead_notes ln ON l.id = ln.lead_id
    LEFT JOIN reminders r ON l.id = r.lead_id
    LEFT JOIN communications c ON l.id = c.lead_id
    LEFT JOIN attachments a ON l.id = a.lead_id
    WHERE l.id = p_lead_id
  )
  SELECT json_build_object(
    'id', v_lead.id,
    'title', v_lead.title,
    'type', v_lead.type,
    'status', v_lead.status,
    'priority', v_lead.priority,
    'company', COALESCE(v_lead.company, ''),
    'description', COALESCE(v_lead.description, ''),
    'venue_id', v_lead.venue_id,
    'venue', COALESCE(v_venue, null),
    'contact_info', COALESCE(v_lead.contact_info, '{}'::jsonb),
    'tags', COALESCE(v_lead.tags, ARRAY[]::text[]),
    'next_follow_up', v_lead.next_follow_up,
    'expected_value', v_lead.expected_value,
    'last_contact_date', v_lead.last_contact_date,
    'created_by', v_lead.created_by,
    'created_by_email', v_lead.created_by_email,
    'assigned_to', v_lead.assigned_to,
    'created_at', v_lead.created_at,
    'updated_at', v_lead.updated_at,
    'lead_notes', rd.lead_notes,
    'reminders', rd.reminders,
    'communications', rd.communications,
    'attachments', rd.attachments
  )
  INTO v_result
  FROM related_data rd;
  
  RETURN v_result;
END;
$function$; 
-- First, let's check what's actually in the database
CREATE OR REPLACE FUNCTION public.debug_lead_data(p_lead_id uuid)
RETURNS TABLE (
    raw_lead json,
    with_details json
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the authenticated user's ID
    v_user_id := auth.uid();
    
    -- Get the raw lead data directly
    CREATE TEMP TABLE temp_raw AS
    SELECT row_to_json(l.*) as raw_data
    FROM leads l
    WHERE l.id = p_lead_id
        AND (l.created_by = v_user_id OR l.assigned_to = v_user_id);

    -- Get the data through get_lead_with_details
    CREATE TEMP TABLE temp_with_details AS
    SELECT get_lead_with_details(p_lead_id) as detail_data;

    -- Return both for comparison
    RETURN QUERY
    SELECT 
        (SELECT raw_data FROM temp_raw),
        (SELECT detail_data FROM temp_with_details);

    -- Cleanup
    DROP TABLE temp_raw;
    DROP TABLE temp_with_details;
END;
$function$; 
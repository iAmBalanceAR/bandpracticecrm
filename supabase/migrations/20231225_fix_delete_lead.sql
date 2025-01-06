-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS delete_lead(p_lead_id uuid);

CREATE OR REPLACE FUNCTION delete_lead(p_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete the lead only if it belongs to the authenticated user
    DELETE FROM leads
    WHERE id = p_lead_id
    AND (
        created_by_email = auth.jwt()->>'email'
        OR EXISTS (
            SELECT 1 FROM lead_assignments
            WHERE lead_id = p_lead_id
            AND assigned_to_email = auth.jwt()->>'email'
        )
    );

    -- If no rows were affected, the lead either doesn't exist or user doesn't have permission
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found or permission denied';
    END IF;
END;
$$; 
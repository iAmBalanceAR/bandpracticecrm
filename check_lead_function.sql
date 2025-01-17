-- Get the current definition of get_lead_with_details function
SELECT 
    pg_get_functiondef(oid) as definition
FROM 
    pg_proc 
WHERE 
    proname = 'get_lead_with_details'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'); 
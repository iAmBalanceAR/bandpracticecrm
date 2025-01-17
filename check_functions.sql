-- Get the definition of update_lead function
SELECT 
    proname as function_name,
    prosrc as function_source,
    proargnames as argument_names,
    proargtypes as argument_types,
    prorettype::regtype as return_type
FROM 
    pg_proc 
WHERE 
    proname = 'update_lead'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Get the definition of create_lead function
SELECT 
    proname as function_name,
    prosrc as function_source,
    proargnames as argument_names,
    proargtypes as argument_types,
    prorettype::regtype as return_type
FROM 
    pg_proc 
WHERE 
    proname = 'create_lead'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- List all functions in public schema
SELECT 
    p.proname as function_name,
    p.prosrc as function_source,
    p.proargnames as argument_names,
    p.proargtypes as argument_types,
    p.prorettype::regtype as return_type
FROM 
    pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public'
    AND p.prokind = 'f'  -- Only regular functions, not aggregates
ORDER BY 
    p.proname; 
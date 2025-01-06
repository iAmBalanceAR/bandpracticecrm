-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON leads;

-- Create new RLS policies using auth.uid()
CREATE POLICY "Users can view their own leads"
  ON leads FOR SELECT
  USING (auth.uid()::text = created_by);

CREATE POLICY "Users can insert their own leads"
  ON leads FOR INSERT
  WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Users can update their own leads"
  ON leads FOR UPDATE
  USING (auth.uid()::text = created_by);

CREATE POLICY "Users can delete their own leads"
  ON leads FOR DELETE
  USING (auth.uid()::text = created_by);

-- Update existing leads to ensure consistency
UPDATE leads
SET created_by = auth.uid()::text
WHERE created_by IS NULL OR created_by = ''; 
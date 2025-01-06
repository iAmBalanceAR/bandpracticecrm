-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_attachment(jsonb);
DROP FUNCTION IF EXISTS delete_attachment(uuid);

-- Create function to create an attachment
CREATE OR REPLACE FUNCTION create_attachment(attachment_data jsonb)
RETURNS attachments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_attachment attachments;
BEGIN
  INSERT INTO attachments (
    lead_id,
    file_name,
    file_type,
    file_path,
    file_size,
    type,
    uploaded_by,
    uploaded_at
  )
  VALUES (
    (attachment_data->>'lead_id')::uuid,
    attachment_data->>'file_name',
    attachment_data->>'file_type',
    attachment_data->>'file_path',
    (attachment_data->>'file_size')::integer,
    attachment_data->>'type',
    auth.uid(),
    CURRENT_TIMESTAMP
  )
  RETURNING * INTO new_attachment;

  RETURN new_attachment;
END;
$$;

-- Create function to delete an attachment
CREATE OR REPLACE FUNCTION delete_attachment(p_attachment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM attachments
  WHERE id = p_attachment_id
  AND uploaded_by = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attachment not found or permission denied';
  END IF;
END;
$$;

-- Enable RLS on attachments table
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for attachments
CREATE POLICY "Users can view their own attachments"
  ON attachments FOR SELECT
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can insert their own attachments"
  ON attachments FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own attachments"
  ON attachments FOR UPDATE
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own attachments"
  ON attachments FOR DELETE
  USING (uploaded_by = auth.uid());

-- Create indexes for attachments table
CREATE INDEX IF NOT EXISTS attachments_uploaded_by_idx ON attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS attachments_lead_id_idx ON attachments(lead_id);
CREATE INDEX IF NOT EXISTS attachments_uploaded_at_idx ON attachments(uploaded_at); 
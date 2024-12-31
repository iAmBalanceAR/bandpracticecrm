-- Create saved_venues junction table
CREATE TABLE IF NOT EXISTS saved_venues (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    venue_id TEXT REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure no duplicate saves per user
    CONSTRAINT unique_user_venue UNIQUE (user_id, venue_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS saved_venues_user_idx ON saved_venues(user_id);
CREATE INDEX IF NOT EXISTS saved_venues_venue_idx ON saved_venues(venue_id);

-- Create function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_saved_venues_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update last_updated
CREATE TRIGGER update_saved_venues_last_updated
    BEFORE UPDATE ON saved_venues
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_venues_last_updated();

-- Add RLS policies
ALTER TABLE saved_venues ENABLE ROW LEVEL SECURITY;

-- Users can read their own saved venues
CREATE POLICY "Users can view their own saved venues"
    ON saved_venues FOR SELECT
    USING (auth.uid() = user_id);

-- Users can save venues
CREATE POLICY "Users can save venues"
    ON saved_venues FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can unsave their own saved venues
CREATE POLICY "Users can delete their own saved venues"
    ON saved_venues FOR DELETE
    USING (auth.uid() = user_id); 
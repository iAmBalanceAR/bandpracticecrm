-- Complete database changes for trial implementation
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS '30_days_no_pay';

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    flag_name TEXT PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trial notifications
CREATE TABLE IF NOT EXISTS trial_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    notification_type TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    days_remaining INTEGER
);

-- Trial management functions
CREATE OR REPLACE FUNCTION check_trial_status()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.subscription_status = '30_days_no_pay' AND 
       OLD.created_at + INTERVAL '30 days' < CURRENT_TIMESTAMP THEN
        NEW.subscription_status := 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Security policies
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY feature_flags_read_policy ON feature_flags
    FOR SELECT TO authenticated
    USING (true);

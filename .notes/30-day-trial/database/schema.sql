-- Complete database implementation for trial system
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS '30_days_no_pay';

-- Feature flags for gradual rollout
CREATE TABLE IF NOT EXISTS feature_flags (
    flag_name TEXT PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trial notification tracking
CREATE TABLE IF NOT EXISTS trial_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    notification_type TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    days_remaining INTEGER
);

-- Security policies
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_notifications ENABLE ROW LEVEL SECURITY;

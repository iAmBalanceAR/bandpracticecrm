# Rollback Procedure

1. Database Rollback

```sql
-- Revert subscription status
ALTER TYPE subscription_status DROP VALUE IF EXISTS '30_days_no_pay';

-- Drop trial tables
DROP TABLE IF EXISTS trial_notifications;
DROP TABLE IF EXISTS feature_flags;

-- Remove trial functions
DROP FUNCTION IF EXISTS check_trial_status()'

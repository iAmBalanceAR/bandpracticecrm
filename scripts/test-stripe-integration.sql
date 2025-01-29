-- Check user profile and subscription linkage
SELECT 
  p.id as profile_id,
  p.email,
  p.stripe_customer_id,
  p.subscription_status,
  s.id as subscription_id,
  s.status as subscription_status_from_sub_table
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id
WHERE p.email = :email_to_check;

-- Check if there are any profiles with null stripe_customer_id but active subscriptions
SELECT 
  p.id as profile_id,
  p.email,
  p.stripe_customer_id,
  s.id as subscription_id,
  s.status as subscription_status
FROM profiles p
JOIN subscriptions s ON p.id = s.user_id
WHERE p.stripe_customer_id IS NULL;

-- Check for orphaned stripe customers (subscriptions without matching profiles)
SELECT 
  s.id as subscription_id,
  s.user_id,
  s.status,
  p.id as profile_id,
  p.email
FROM subscriptions s
LEFT JOIN profiles p ON s.user_id = p.id
WHERE p.id IS NULL; 
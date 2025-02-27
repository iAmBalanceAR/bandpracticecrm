# Stripe Webhook Configuration Guide

## Updating the Webhook Secret

When you receive a new webhook signing secret from Stripe, you need to update it in your application. Follow these steps:

1. **Using the update script:**

   ```bash
   node scripts/update-webhook-secret.js whsec_your_new_secret_here
   ```

   This will update the webhook secret in all your environment files.

2. **Manual update:**

   If you prefer to update manually, edit your `.env.local` file and update the `STRIPE_WEBHOOK_SECRET` value:

   ```
   STRIPE_WEBHOOK_SECRET="whsec_your_new_secret_here"
   ```

3. **Restart your application:**

   After updating the secret, restart your application for the changes to take effect:

   ```bash
   pnpm dev
   ```

## Testing Webhooks

1. **Using the Stripe CLI:**

   ```bash
   stripe listen --forward-to http://localhost:3001/api/webhooks/stripe
   ```

   This will show you the webhook signing secret and forward events to your local server.

2. **Using the test endpoint:**

   Visit `/api/test-env` in your browser to check if the environment variables are loaded correctly.

3. **Using the test webhook script:**

   ```bash
   cd scripts
   pnpm install
   node test-webhook.js customer.subscription.created
   ```

## Troubleshooting

If webhooks are failing, check the following:

1. **Webhook Secret Mismatch:**
   - Ensure the webhook secret in your environment matches the one from Stripe
   - Check the Stripe Dashboard > Developers > Webhooks for the correct secret

2. **API Version Mismatch:**
   - The Stripe SDK might be using a different API version than your webhook events
   - This is usually not a problem as the SDK handles version differences

3. **Signature Verification:**
   - The webhook handler logs signature verification failures
   - Check the server logs for details on why verification is failing

4. **Multiple Webhook Endpoints:**
   - If you have multiple webhook endpoints, ensure each has the correct secret
   - Consider consolidating to a single endpoint if possible

## Production Deployment

When deploying to production:

1. Update the environment variables with the production webhook secret
2. Ensure the webhook URL in the Stripe Dashboard is set to your production URL
3. Test the webhook after deployment using the Stripe Dashboard's "Send test webhook" feature 
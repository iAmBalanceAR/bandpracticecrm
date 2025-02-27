#Stripe Webhook Integration Guide

This document explains how the Stripe webhook integration works in Band Practice CRM and how to test it.

##Webhook Architecture

The application uses a single webhook endpoint to handle all Stripe events:

- **Primary Endpoint**: `/api/webhooks/stripe`
  - Handles all Stripe events including subscriptions, payments, and product/price updates
  - Properly handles test price IDs by setting them to `null` in the database to avoid foreign key constraint errors

##Testing Webhooks Locally

To test the webhook integration locally:

1. Start your development server: ```

   pnpm dev ```

2. Use the built-in scripts to test and manage webhooks:
3 #Update environment variables with the new webhook secret
4:pnpm webhook:update-env

#Restart the server with a clean environment
npm webhook:restart

#Check if environment variables are loaded correctly
webhook:check

#Test the webhook with a sample event
pnpm webhook:test ```

4. Alternatively, you can run the test script directly with a specific event type: ```
   node scripts/test-webhook.js customer.subscription.created ```

   Available event types:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `price.created`

5. The script will send a test webhook event to your local server and display the response.

## Webhook Handler Features

The webhook handler includes the following features:

1. **Test Mode Support**: Handles test price IDs by setting them to `null` in the database to avoid foreign key constraint errors
2. **Comprehensive Logging**: Detailed logging for easier debugging
3. **Error Handling**: Proper error handling with 200 responses to prevent Stripe from retrying failed webhooks
4. **Multiple Secret Support**: Can verify webhooks using multiple webhook secrets

## Configuring Stripe Webhooks in Production

1. In the Stripe Dashboard, go to Developers > Webhooks
2. Add a new endpoint with the URL: `https://yourdomain.com/api/webhooks/stripe`
3. Select the events you want to receive:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `product.created`, `product.updated`, `product.deleted`
   - `price.created`, `price.updated`, `price.deleted`
   - `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.processing`
   - Account events if needed

4. Copy the webhook signing secret and update your environment variables:

   ```
   # Update the webhook secret in your environment files
   node scripts/update-env.js
   ```

## Troubleshooting

If you encounter issues with the webhook integration:

1. Check the server logs for detailed error messages
2. Verify that the webhook secret is correctly set in your environment variables:

   ```
   # Check environment variables
   curl http://localhost:3001/api/env-check
   ```

3. Ensure the database schema matches the expected structure
4. For test events, make sure you're using a valid user ID in the test script
5. If you've updated the webhook secret, restart your server:

   ```
   pnpm webhook:restart
   ```

6. If you're still having issues, try the hardcoded fallback in the webhook handler

## Environment Variables

The webhook handler uses the following environment variables:

- `STRIPE_WEBHOOK_SECRET`: The primary webhook signing secret
- `STRIPE_WEBHOOK_SECRET_SUBSCRIPTION`: Optional secondary webhook secret
- `NODE_ENV`: The current environment (development, production)

## Database Schema

The webhook handler interacts with the following tables:

- `profiles`: Updates subscription status and customer ID
- `subscriptions`: Creates and updates subscription records
- `products`: Manages product catalog
- `prices`: Manages price catalog

Foreign key constraints require that price IDs exist in the `prices` table, but test price IDs are handled by setting them to `null` to avoid constraint errors.

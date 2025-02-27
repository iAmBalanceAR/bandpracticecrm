import { NextResponse } from 'next/server'
import { stripe } from '@/utils/stripe'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { Stripe } from 'stripe'
import { redirect } from 'next/navigation'

// Create a Supabase client specifically for webhooks
const supabase = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin access
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
)

const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'product.deleted',
  'price.created',
  'price.updated',
  'price.deleted',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.processing',
])

type ValidSubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'

function isValidSubscriptionStatus(status: string): status is ValidSubscriptionStatus {
  return ['active', 'trialing', 'past_due', 'canceled', 'unpaid'].includes(status)
}

async function upsertProductRecord(product: Stripe.Product) {
  const productData = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  }

  const { error } = await supabase
    .from('products')
    .upsert([productData])

  if (error) throw error
  console.log(`Product inserted/updated: ${product.id}`)
}

async function upsertPriceRecord(price: Stripe.Price) {
  const priceData = {
    id: price.id,
    product_id: typeof price.product === 'string' ? price.product : '',
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? null,
    type: price.type,
    unit_amount: price.unit_amount ?? null,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata
  }

  const { error } = await supabase
    .from('prices')
    .upsert([priceData])

  if (error) throw error
  console.log(`Price inserted/updated: ${price.id}`)
}

async function deleteProductRecord(productId: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .match({ id: productId })

  if (error) throw error
  console.log(`Product deleted: ${productId}`)
}

async function deletePriceRecord(priceId: string) {
  const { error } = await supabase
    .from('prices')
    .delete()
    .match({ id: priceId })

  if (error) throw error
  console.log(`Price deleted: ${priceId}`)
}

async function upsertSubscriptionRecord(subscription: Stripe.Subscription, customerId: string) {
  // Map Stripe status to our database status
  const statusMap: Record<Stripe.Subscription.Status, ValidSubscriptionStatus | null> = {
    'active': 'active',
    'trialing': 'trialing',
    'past_due': 'past_due',
    'canceled': 'canceled',
    'unpaid': 'unpaid',
    'incomplete': null,
    'incomplete_expired': null,
    'paused': null
  }

  const status = statusMap[subscription.status]
  if (!status) {
    console.log(`Skipping subscription sync for status: ${subscription.status}`)
    return
  }

  const subscriptionData = {
    id: subscription.id,
    user_id: customerId,
    status,
    price_id: subscription.items.data[0].price.id,
    quantity: subscription.items.data[0].quantity,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    created: new Date(subscription.created * 1000).toISOString(),
    ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    metadata: subscription.metadata
  }

  const { error } = await supabase
    .from('subscriptions')
    .upsert([subscriptionData])

  if (error) throw error
  console.log(`Subscription inserted/updated: ${subscription.id}`)

  // Also update the profile subscription status
  if (status) {
    await supabase
      .from('profiles')
      .update({
        subscription_status: status,
        subscription_price_id: subscription.items.data[0].price.id,
        subscription_id: subscription.id,
      })
      .eq('id', customerId)
  }
}

// This webhook endpoint is deprecated
// All webhook events should be sent to /api/webhooks/stripe
export async function POST(req: Request) {
  console.log('⚠️ Deprecated webhook endpoint called, redirecting to /api/webhooks/stripe');
  
  // Clone the request to forward it
  const clonedBody = await req.text();
  const headers = new Headers(req.headers);
  
  try {
    // Forward the request to the main webhook handler
    const response = await fetch(new URL('/api/webhooks/stripe', req.url).toString(), {
      method: 'POST',
      headers: headers,
      body: clonedBody
    });
    
    // Return the response from the main handler
    const responseBody = await response.text();
    console.log('✅ Request forwarded successfully to main webhook handler');
    
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Error forwarding webhook request:', error);
    
    // Return a 200 to prevent Stripe from retrying
    return new NextResponse(JSON.stringify({ 
      received: true,
      message: 'Webhook received but error occurred during forwarding'
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 
import { NextResponse } from 'next/server'
import { stripe } from '@/utils/stripe'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { Stripe } from 'stripe'

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

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  let event: Stripe.Event | undefined

  try {
    if (!signature) {
      console.log('Missing signature')
      return new NextResponse(JSON.stringify({ received: true }))
    }
    
    // Try multiple webhook secrets
    const webhookSecrets = [
      process.env.STRIPE_WEBHOOK_SECRET,
      process.env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTION
    ].filter(Boolean)

    let error: any
    
    // Try each secret until one works
    for (const secret of webhookSecrets) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, secret!)
        break
      } catch (err) {
        error = err
        continue
      }
    }

    // If we get here and event is not defined, no secrets worked
    if (!event) {
      console.error('Invalid signature:', error?.message)
      return new NextResponse(JSON.stringify({ received: true }))
    }

  } catch (err: any) {
    console.error('Error verifying webhook signature:', err.message)
    return new NextResponse(JSON.stringify({ received: true }))
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'product.created':
        case 'product.updated':
          await upsertProductRecord(event.data.object as Stripe.Product)
          break
        case 'product.deleted':
          await deleteProductRecord((event.data.object as Stripe.Product).id)
          break
        case 'price.created':
        case 'price.updated':
          await upsertPriceRecord(event.data.object as Stripe.Price)
          break
        case 'price.deleted':
          await deletePriceRecord((event.data.object as Stripe.Price).id)
          break
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription
          const customer = await stripe.customers.retrieve(
            subscription.customer as string
          ) as Stripe.Customer

          const userId = customer.metadata.supabase_user_id
          if (!userId) {
            console.error('No supabase_user_id found in customer metadata')
            return new NextResponse('Missing user ID in metadata', { status: 400 })
          }

          if (event.type === 'customer.subscription.deleted') {
            // Clear subscription data from profile
            await supabase
              .from('profiles')
              .update({
                subscription_status: null,
                subscription_price_id: null,
                subscription_id: null
              })
              .eq('id', userId)

            // Mark subscription as ended in subscriptions table
            await supabase
              .from('subscriptions')
              .update({
                status: 'canceled',
                ended_at: new Date().toISOString()
              })
              .eq('id', subscription.id)

            console.log(`Subscription ${subscription.id} deleted and data cleaned up for user ${userId}`)
            break
          }

          // For created/updated events, continue with normal update
          await upsertSubscriptionRecord(subscription, userId)

          // Also update the profile subscription status
          const status = subscription.status
          if (isValidSubscriptionStatus(status)) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: status,
                subscription_price_id: subscription.items.data[0].price.id,
                subscription_id: subscription.id,
              })
              .eq('id', userId)
          }
          break
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          console.log(`💰 PaymentIntent succeeded: ${paymentIntent.id}`)
          
          // If this is a subscription payment
          if (paymentIntent.metadata.subscription_id) {
            const subscription = await stripe.subscriptions.retrieve(
              paymentIntent.metadata.subscription_id
            )
            
            // Update subscription status in database
            await supabase
              .from('subscriptions')
              .update({
                status: subscription.status,
                latest_payment_success: true,
                latest_payment_error: null
              })
              .eq('id', subscription.id)
          }
          break
        case 'payment_intent.payment_failed':
          const failedIntent = event.data.object as Stripe.PaymentIntent
          console.log(`❌ Payment failed: ${failedIntent.id}`)
          const error = failedIntent.last_payment_error?.message
          
          if (failedIntent.metadata.subscription_id) {
            // Update subscription status in database
            await supabase
              .from('subscriptions')
              .update({
                latest_payment_success: false,
                latest_payment_error: error || 'Payment failed'
              })
              .eq('id', failedIntent.metadata.subscription_id)
          }
          break
        case 'payment_intent.processing':
          const processingIntent = event.data.object as Stripe.PaymentIntent
          console.log(`⏳ Payment processing: ${processingIntent.id}`)
          
          if (processingIntent.metadata.subscription_id) {
            // Update subscription status to indicate processing
            await supabase
              .from('subscriptions')
              .update({
                status: 'processing',
                latest_payment_error: null
              })
              .eq('id', processingIntent.metadata.subscription_id)
          }
          break
        default:
          throw new Error(`Unhandled relevant event: ${event.type}`)
      }
    } catch (error) {
      console.error('Error handling Stripe webhook:', error)
      return new NextResponse(JSON.stringify({ received: true }))
    }
  }

  return new NextResponse(JSON.stringify({ received: true }))
} 
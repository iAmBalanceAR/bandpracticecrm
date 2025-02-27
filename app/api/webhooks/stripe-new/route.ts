import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

// List of events we want to handle
const RELEVANT_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed'
]

// Helper function to convert Stripe timestamp to ISO string
function timestampToISO(timestamp: number | null | undefined): string | null {
  if (!timestamp) return null
  return new Date(timestamp * 1000).toISOString()
}

/**
 * Log details about the webhook processing
 */
function logWebhookEvent(event: Stripe.Event, message: string, data?: any) {
  console.log(`[Stripe Webhook] ${event.type} - ${event.id}: ${message}`, data || '')
}

/**
 * Log errors with extra context
 */
function logError(event: Stripe.Event, message: string, error: any) {
  console.error(
    `[Stripe Webhook ERROR] ${event.type} - ${event.id}: ${message}`,
    error
  )
}

/**
 * Update the subscription in the database - handles both subscriptions and profiles tables
 */
async function updateSubscriptionInDB(
  supabase: any,
  subscription: Stripe.Subscription,
  userId: string
) {
  // Get main price ID from the subscription
  const priceId = subscription.items.data[0]?.price.id

  // Format the subscription data for our database
  const subscriptionData = {
    id: subscription.id,
    user_id: userId,
    status: subscription.status,
    price_id: priceId,
    quantity: subscription.items.data[0]?.quantity || 1,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: timestampToISO(subscription.cancel_at),
    canceled_at: timestampToISO(subscription.canceled_at),
    current_period_start: timestampToISO(subscription.current_period_start),
    current_period_end: timestampToISO(subscription.current_period_end),
    created: timestampToISO(subscription.created),
    ended_at: timestampToISO(subscription.ended_at),
    trial_start: timestampToISO(subscription.trial_start),
    trial_end: timestampToISO(subscription.trial_end),
    metadata: subscription.metadata
  }

  // First update the subscription record
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .upsert(subscriptionData)

  if (subscriptionError) {
    throw new Error(`Failed to update subscription: ${subscriptionError.message}`)
  }

  // Then update the profile with subscription info
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status,
      subscription_id: subscription.id,
      subscription_price_id: priceId
    })
    .eq('id', userId)
  
  if (profileError) {
    throw new Error(`Failed to update profile: ${profileError.message}`)
  }
}

/**
 * Find user ID by Stripe customer ID
 */
async function findUserByStripeCustomerId(supabase: any, customerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (error) {
    return null
  }

  return data?.id || null
}

/**
 * Find user ID by email
 */
async function findUserByEmail(supabase: any, email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (error) {
    return null
  }

  return data?.id || null
}

/**
 * Handler for checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(
  supabase: any,
  event: Stripe.Event,
  session: Stripe.Checkout.Session
) {
  logWebhookEvent(event, 'Processing checkout session completed')

  // Get customer ID from the session
  const customerId = session.customer as string
  if (!customerId) {
    logError(event, 'No customer ID in session', { session_id: session.id })
    return
  }

  // Try to get user ID from session metadata
  let userId: string | null | undefined = session.metadata?.supabase_user_id
  
  // If no user ID in metadata, try to find by customer ID
  if (!userId) {
    userId = await findUserByStripeCustomerId(supabase, customerId)
  }
  
  // If still no user ID, try to find by email
  if (!userId && session.customer_email) {
    userId = await findUserByEmail(supabase, session.customer_email)
  }

  if (!userId) {
    logError(event, 'Failed to identify user for checkout session', {
      customer_id: customerId,
      email: session.customer_email
    })
    return
  }

  logWebhookEvent(event, 'Found user for checkout session', {
    user_id: userId,
    customer_id: customerId
  })

  // Update customer ID in profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ stripe_customer_id: customerId })
    .eq('id', userId)

  if (updateError) {
    logError(event, 'Failed to update customer ID in profile', updateError)
    return
  }

  // If there's a subscription, retrieve and process it
  if (session.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      )
      
      await updateSubscriptionInDB(supabase, subscription, userId)
      logWebhookEvent(event, 'Updated subscription from checkout', {
        subscription_id: subscription.id,
        status: subscription.status
      })
    } catch (error) {
      logError(event, 'Failed to process subscription from checkout', error)
    }
  }
}

/**
 * Handler for subscription created/updated events
 */
async function handleSubscriptionChange(
  supabase: any,
  event: Stripe.Event,
  subscription: Stripe.Subscription
) {
  logWebhookEvent(event, 'Processing subscription change', {
    subscription_id: subscription.id,
    status: subscription.status
  })

  // Try to get user ID from subscription metadata
  let userId: string | null = subscription.metadata.supabase_user_id || null
  
  // If no user ID in metadata, try to find by customer ID
  if (!userId) {
    userId = await findUserByStripeCustomerId(supabase, subscription.customer as string)
  }

  // If still no user ID, try to find from customer object
  if (!userId) {
    try {
      const customer = await stripe.customers.retrieve(subscription.customer as string)
      if (!customer.deleted) {
        // Try from customer metadata
        userId = customer.metadata.supabase_user_id || null
        
        // If still nothing, try by email
        if (!userId && customer.email) {
          userId = await findUserByEmail(supabase, customer.email)
        }
      }
    } catch (error) {
      logError(event, 'Failed to retrieve customer details', error)
    }
  }

  if (!userId) {
    logError(event, 'Failed to identify user for subscription', {
      subscription_id: subscription.id,
      customer_id: subscription.customer
    })
    return
  }

  // Update subscription in database
  try {
    await updateSubscriptionInDB(supabase, subscription, userId)
    logWebhookEvent(event, 'Subscription updated successfully', {
      subscription_id: subscription.id,
      status: subscription.status,
      user_id: userId
    })
  } catch (error) {
    logError(event, 'Failed to update subscription in database', error)
  }
}

/**
 * Handler for subscription deleted event
 */
async function handleSubscriptionDeleted(
  supabase: any,
  event: Stripe.Event,
  subscription: Stripe.Subscription
) {
  logWebhookEvent(event, 'Processing subscription deletion', {
    subscription_id: subscription.id
  })

  // Try to get user ID from subscription metadata
  let userId: string | null = subscription.metadata.supabase_user_id || null
  
  // If no user ID in metadata, try to find by customer ID
  if (!userId) {
    userId = await findUserByStripeCustomerId(supabase, subscription.customer as string)
  }

  if (!userId) {
    logError(event, 'Failed to identify user for deleted subscription', {
      subscription_id: subscription.id
    })
    return
  }

  // Mark the subscription as canceled in our database
  try {
    await updateSubscriptionInDB(supabase, {
      ...subscription,
      status: 'canceled'
    } as Stripe.Subscription, userId)

    // Additionally, clear subscription data from profile
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: null,
        subscription_id: null,
        subscription_price_id: null
      })
      .eq('id', userId)

    if (error) {
      logError(event, 'Failed to clear profile subscription data', error)
      return
    }

    logWebhookEvent(event, 'Subscription marked as canceled', {
      subscription_id: subscription.id,
      user_id: userId
    })
  } catch (error) {
    logError(event, 'Failed to mark subscription as canceled', error)
  }
}

/**
 * Handler for invoice events
 */
async function handleInvoiceEvent(
  supabase: any,
  event: Stripe.Event,
  invoice: Stripe.Invoice
) {
  // Only process subscription invoices
  if (!invoice.subscription) {
    return
  }

  logWebhookEvent(event, 'Processing invoice event', {
    invoice_id: invoice.id,
    subscription_id: invoice.subscription
  })

  try {
    // Get the subscription related to this invoice
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    
    // Find the user
    let userId: string | null = subscription.metadata.supabase_user_id || null
    if (!userId) {
      userId = await findUserByStripeCustomerId(supabase, invoice.customer as string)
    }

    if (!userId) {
      logError(event, 'Failed to identify user for invoice', {
        invoice_id: invoice.id,
        subscription_id: invoice.subscription
      })
      return
    }

    // Update the subscription status based on the invoice
    if (event.type === 'invoice.paid') {
      // If invoice is paid, make sure subscription is marked as active
      if (subscription.status !== 'active') {
        await updateSubscriptionInDB(supabase, {
          ...subscription,
          status: 'active'
        } as Stripe.Subscription, userId)
      } else {
        // Still update to ensure we have the latest data
        await updateSubscriptionInDB(supabase, subscription, userId)
      }
      
      logWebhookEvent(event, 'Invoice paid, subscription marked as active', {
        invoice_id: invoice.id,
        subscription_id: subscription.id
      })
    } else if (event.type === 'invoice.payment_failed') {
      // If payment failed, update status to reflect this
      await updateSubscriptionInDB(supabase, {
        ...subscription,
        status: 'past_due'
      } as Stripe.Subscription, userId)
      
      logWebhookEvent(event, 'Invoice payment failed, subscription marked as past_due', {
        invoice_id: invoice.id,
        subscription_id: subscription.id
      })
    }
  } catch (error) {
    logError(event, 'Failed to process invoice event', error)
  }
}

/**
 * Main webhook handler
 */
export async function POST(req: Request) {
  console.log('[Stripe Webhook] Received webhook request')
  
  try {
    // Get the request body and signature header
    const body = await req.text()
    const signature = headers().get('stripe-signature')
    
    if (!signature) {
      console.error('[Stripe Webhook ERROR] No stripe signature found')
      return new NextResponse('No Stripe signature found', { status: 400 })
    }

    // Make sure webhook secret is configured
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[Stripe Webhook ERROR] Stripe webhook secret not configured')
      return new NextResponse('Webhook secret not configured', { status: 500 })
    }

    // Verify the event
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('[Stripe Webhook ERROR] Error verifying webhook:', err)
      return new NextResponse(
        `Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}`,
        { status: 400 }
      )
    }

    console.log(`[Stripe Webhook] Event verified: ${event.type} - ${event.id}`)

    // Initialize Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: () => '',
          set: () => {},
          remove: () => {},
        },
      }
    )

    // Only process events we care about
    if (!RELEVANT_EVENTS.includes(event.type)) {
      return new NextResponse(JSON.stringify({ received: true }), { status: 200 })
    }

    // Process the event based on its type
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(
            supabase,
            event,
            event.data.object as Stripe.Checkout.Session
          )
          break

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionChange(
            supabase,
            event,
            event.data.object as Stripe.Subscription
          )
          break

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(
            supabase,
            event,
            event.data.object as Stripe.Subscription
          )
          break

        case 'invoice.paid':
        case 'invoice.payment_failed':
          await handleInvoiceEvent(
            supabase,
            event,
            event.data.object as Stripe.Invoice
          )
          break
      }

      // Return a 200 response to acknowledge receipt of the event
      return new NextResponse(JSON.stringify({ received: true }), { status: 200 })
    } catch (error) {
      logError(event, 'Error processing webhook event', error)
      return new NextResponse(
        `Webhook handler failed: ${error instanceof Error ? error.message : 'Unknown Error'}`,
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[Stripe Webhook ERROR] General webhook error:', error)
    return new NextResponse(
      `Webhook error: ${error instanceof Error ? error.message : 'Unknown Error'}`,
      { status: 400 }
    )
  }
} 
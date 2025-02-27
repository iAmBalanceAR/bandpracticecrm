import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

// Define relevant events we want to handle
const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'charge.succeeded',
  'charge.updated',
  'payment_intent.created',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.processing',
  'product.created',
  'product.updated',
  'product.deleted',
  'price.created',
  'price.updated',
  'price.deleted'
])

// Helper function to safely convert Unix timestamp to ISO string
function safeTimestampToISO(timestamp: number | null | undefined): string | null {
  if (!timestamp) return null
  try {
    return new Date(timestamp * 1000).toISOString()
  } catch (error) {
    console.error(`Error converting timestamp ${timestamp} to ISO string:`, error)
    return null
  }
}

// Helper to update subscription in database
async function updateSubscriptionInDB(
  supabase: any,
  subscription: Stripe.Subscription,
  userId: string,
  status: string
) {
  const priceId = subscription.items.data[0]?.price.id
  
  // First update the subscription record
            const subscriptionData = {
              id: subscription.id,
              user_id: userId,
    status: status,
    price_id: priceId,
              quantity: subscription.items.data[0]?.quantity,
              cancel_at_period_end: subscription.cancel_at_period_end,
              cancel_at: safeTimestampToISO(subscription.cancel_at),
              canceled_at: safeTimestampToISO(subscription.canceled_at),
              current_period_start: safeTimestampToISO(subscription.current_period_start),
              current_period_end: safeTimestampToISO(subscription.current_period_end),
              created: safeTimestampToISO(subscription.created),
              ended_at: safeTimestampToISO(subscription.ended_at),
              trial_start: safeTimestampToISO(subscription.trial_start),
              trial_end: safeTimestampToISO(subscription.trial_end),
              metadata: subscription.metadata
            }

            const { error: subscriptionError } = await supabase
              .from('subscriptions')
              .upsert(subscriptionData)

            if (subscriptionError) {
    throw new Error(`Failed to update subscription: ${subscriptionError.message}`)
            }

  // Then update the profile
  const { error: profileError } = await supabase
              .from('profiles')
              .update({
      subscription_status: status,
                subscription_id: subscription.id,
      subscription_price_id: priceId
              })
              .eq('id', userId)
            
  if (profileError) {
    throw new Error(`Failed to update profile: ${profileError.message}`)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')
    
    if (!signature) {
      console.error('No stripe signature found')
      return new Response('No Stripe signature found', { status: 400 })
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing Stripe webhook secret')
      return new Response('Webhook secret not configured', { status: 500 })
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
      console.error('Error verifying webhook:', err)
      return new Response(
        `Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}`,
        { status: 400 }
      )
    }

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

    // Handle the event
    if (relevantEvents.has(event.type)) {
      try {
        switch (event.type) {
          case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session
            const userId = session.metadata?.supabase_user_id
            const customerId = session.customer as string
              
              if (!userId) {
              throw new Error('No user ID found in session metadata')
            }

            // Update customer ID in profile
            await supabase
              .from('profiles')
              .update({ stripe_customer_id: customerId })
              .eq('id', userId)

            // If there's a subscription, process it
            if (session.subscription) {
              const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
              await updateSubscriptionInDB(supabase, subscription, userId, subscription.status)
            }
            break
          }

          case 'customer.subscription.created':
          case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription
            const userId = subscription.metadata.supabase_user_id
                
                if (!userId) {
              // Try to find user ID from customer
              const customer = await stripe.customers.retrieve(subscription.customer as string)
              if (!customer.deleted) {
                const userIdFromCustomer = customer.metadata.supabase_user_id
                if (userIdFromCustomer) {
                  await updateSubscriptionInDB(supabase, subscription, userIdFromCustomer, subscription.status)
                } else {
                  throw new Error('No user ID found in customer metadata')
                }
              }
            } else {
              await updateSubscriptionInDB(supabase, subscription, userId, subscription.status)
            }
            break
          }

          case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription
            const userId = subscription.metadata.supabase_user_id

            if (userId) {
              // Update subscription record
              await updateSubscriptionInDB(supabase, subscription, userId, 'canceled')
              
              // Clear subscription data from profile
              await supabase
                .from('profiles')
                .update({
                  subscription_status: null,
                  subscription_id: null,
                  subscription_price_id: null
                })
                .eq('id', userId)
            }
            break
          }

          case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent
            // Handle successful payment
            if (paymentIntent.metadata.supabase_user_id) {
              // Update subscription if this was a bank transfer
              if (paymentIntent.payment_method_types.includes('customer_balance')) {
                const subscription = await stripe.subscriptions.retrieve(paymentIntent.metadata.subscription_id)
                await updateSubscriptionInDB(
                  supabase,
                  subscription,
                  paymentIntent.metadata.supabase_user_id,
                  'active'
                )
              }
            }
            break
          }

          case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent
            if (paymentIntent.metadata.supabase_user_id) {
              // Update subscription status for failed payment
              if (paymentIntent.metadata.subscription_id) {
                const subscription = await stripe.subscriptions.retrieve(paymentIntent.metadata.subscription_id)
                await updateSubscriptionInDB(
                  supabase,
                  subscription,
                  paymentIntent.metadata.supabase_user_id,
                  'past_due'
                )
              }
            }
            break
          }

          case 'charge.succeeded':
          case 'charge.updated': {
            const charge = event.data.object as Stripe.Charge
            // Log charge events but no action needed as payment_intent events handle the business logic
            console.log(`Charge ${event.type}:`, {
              id: charge.id,
              amount: charge.amount,
              status: charge.status,
              paymentIntent: charge.payment_intent
            })
            break
          }

          case 'payment_intent.created': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent
            // Log payment intent creation but no action needed
            console.log('Payment Intent created:', {
              id: paymentIntent.id,
              amount: paymentIntent.amount,
              status: paymentIntent.status
            })
            break
        }

        case 'product.created':
        case 'product.updated': {
          const product = event.data.object as Stripe.Product
          // Update or insert product
          await supabase
            .from('products')
            .upsert({
              id: product.id,
              active: product.active,
              name: product.name,
              description: product.description,
              image: product.images?.[0] ?? null,
                metadata: product.metadata
            })
          break
        }

        case 'product.deleted': {
          const product = event.data.object as Stripe.Product
          // Soft delete by setting active to false
          await supabase
            .from('products')
            .update({ active: false })
            .eq('id', product.id)
          break
        }

        case 'price.created':
        case 'price.updated': {
          const price = event.data.object as Stripe.Price
          // Update or insert price
          await supabase
            .from('prices')
            .upsert({
              id: price.id,
              product_id: price.product as string,
              active: price.active,
              currency: price.currency,
              type: price.type,
              unit_amount: price.unit_amount,
              interval: price.recurring?.interval ?? null,
              interval_count: price.recurring?.interval_count ?? null,
                trial_period_days: price.recurring?.trial_period_days ?? null,
                metadata: price.metadata
            })
          break
        }

        case 'price.deleted': {
          const price = event.data.object as Stripe.Price
          // Soft delete by setting active to false
          await supabase
            .from('prices')
            .update({ active: false })
            .eq('id', price.id)
          break
        }
        }
      } catch (error) {
        console.error(`Error handling webhook ${event.type}:`, error)
        return new Response(
          `Webhook handler failed: ${error instanceof Error ? error.message : 'Unknown Error'}`,
          { status: 400 }
        )
      }
    }

    // Return a response to acknowledge receipt of the event
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      `Webhook error: ${error instanceof Error ? error.message : 'Unknown Error'}`,
      { status: 400 }
    )
  }
}
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'product.created',
  'product.updated',
  'product.deleted',
  'price.created',
  'price.updated',
  'price.deleted'
])

export async function POST(req: Request) {
  const body = await req.text()
  const sig = headers().get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event

  try {
    if (!sig || !webhookSecret) {
      console.log('Missing stripe signature or webhook secret')
      return new Response('Missing stripe signature or webhook secret', { status: 400 })
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.log(`❌ Error message: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (relevantEvents.has(event.type)) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get: () => undefined,
            set: () => {},
            remove: () => {}
          }
        }
      )

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session
          const userId = session.metadata?.supabase_user_id

          console.log('Webhook: Checkout completed:', {
            sessionId: session.id,
            userId,
            subscription: session.subscription,
            customer: session.customer,
            metadata: session.metadata,  // Log all metadata
            mode: session.mode          // Check if it's in subscription mode
          })
          
          if (!userId) {
            console.error('No userId found in session metadata')
            return
          }

          if (!session.subscription) {
            console.error('No subscription found in session')
            return
          }

          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          console.log('Webhook: Subscription details:', {
            id: subscription.id,
            status: subscription.status,
            customerId: subscription.customer,
            metadata: subscription.metadata
          })
          
          // First check if we can read the profile
          const { data: profile, error: readError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

          if (readError) {
            console.error('Error reading profile:', readError)
            return
          }

          console.log('Found profile:', profile)

          // Then try to update
          const { data, error } = await supabase
            .rpc('handle_subscription_update', {
              user_id: userId,
              customer_id: subscription.customer,
              subscription_id: subscription.id,
              status: subscription.status,
              price_id: subscription.items.data[0]?.price.id || null
            })
          
          if (error) {
            console.error('Stored procedure error:', error)
          } else {
            console.log('Subscription updated:', data)
          }
          break
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription
          const userId = subscription.metadata?.supabase_user_id

          console.log('Subscription event:', {
            type: event.type,
            userId,
            subscriptionId: subscription.id,
            status: subscription.status
          })

          if (userId) {
            const { data, error } = await supabase
              .from('profiles')
              .update({
                subscription_status: subscription.status,
                subscription_id: subscription.id,
                subscription_price_id: subscription.items.data[0]?.price.id || null
              })
              .eq('id', userId)
              .select()

            if (error) {
              console.error('Supabase update error:', error)
            } else {
              console.log('Profile updated:', data)
            }
          }
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
              features: product.features || [], // Stripe's built-in features
              marketing_features: product.metadata?.marketing_feature_list?.split(',').map(f => f.trim()) || [], // Marketing features from metadata
              image: product.images?.[0] ?? null,
              created: new Date(product.created * 1000).toISOString()
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
              trial_period_days: price.recurring?.trial_period_days ?? null
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

        default:
          console.log(`Unhandled event type ${event.type}`)
      }
    } catch (error) {
      console.log(error)
      return new Response(
        'Webhook handler failed. View your Next.js function logs.',
        { status: 400 }
      )
    }
  }

  return new Response(JSON.stringify({ received: true }))
} 
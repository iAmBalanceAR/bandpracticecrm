import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/utils/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

const relevantEvents = new Set([
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
      const supabase = createClient()

      switch (event.type) {
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
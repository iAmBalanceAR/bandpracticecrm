import Stripe from 'stripe'
import { createClient } from '@/utils/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function syncStripeProducts() {
  const supabase = createClient()

  try {
    // Fetch all active products from Stripe
    const products = await stripe.products.list({ active: true })
    
    // Fetch all prices for these products
    const prices = await stripe.prices.list({ active: true })

    // Sync products
    for (const product of products.data) {
      await supabase
        .from('products')
        .upsert({
          id: product.id,
          active: product.active,
          name: product.name,
          description: product.description,
          features: product.features || [],
          marketing_features: product.metadata?.marketing_feature_list?.split(',').map(f => f.trim()) || [],
          image: product.images?.[0] ?? null,
          created: new Date(product.created * 1000).toISOString()
        })
    }

    // Sync prices
    for (const price of prices.data) {
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
    }

    return { success: true }
  } catch (error) {
    console.error('Error syncing Stripe data:', error)
    return { success: false, error }
  }
} 
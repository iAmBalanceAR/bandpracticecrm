import { config } from 'dotenv'
import { resolve } from 'path'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Verify environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
})

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function syncStripeProducts() {
  try {
    // Fetch all active products from Stripe
    const products = await stripe.products.list({ active: true })
    console.log(`Found ${products.data.length} active products`)

    // Fetch all prices for these products
    const prices = await stripe.prices.list({ active: true })
    console.log(`Found ${prices.data.length} active prices`)

    // Upsert products
    for (const product of products.data) {
      const productData = {
        id: product.id,
        active: product.active,
        name: product.name,
        description: product.description ?? null,
        image: product.images?.[0] ?? null,
        metadata: product.metadata,
      }

      const { error: productError } = await supabase
        .from('products')
        .upsert([productData])

      if (productError) {
        console.error(`Error upserting product ${product.id}:`, productError)
        continue
      }
      console.log(`Synced product: ${product.name}`)
    }

    // Upsert prices
    for (const price of prices.data) {
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

      const { error: priceError } = await supabase
        .from('prices')
        .upsert([priceData])

      if (priceError) {
        console.error(`Error upserting price ${price.id}:`, priceError)
        continue
      }
      console.log(`Synced price: ${price.id}`)
    }

    console.log('Sync completed successfully!')
  } catch (error) {
    console.error('Error syncing products:', error)
    process.exit(1)
  }
}

// Run the sync
syncStripeProducts() 
import { createClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function GET() {
  try {
    const supabase = createClient()

    console.log('Starting product sync...')

    // Fetch all active products from Stripe
    const { data: products } = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    })

    if (!products || products.length === 0) {
      console.log('No products found in Stripe')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No products found in Stripe'
      }), { status: 404 })
    }

    console.log('Fetched products from Stripe:', JSON.stringify(products, null, 2))

    // Update each product in Supabase
    for (const product of products) {
      try {
        console.log('Processing product:', product.id)
        console.log('Raw metadata:', JSON.stringify(product.metadata, null, 2))
        
        // Parse feature lists from metadata and clean them
        const featureList = product.metadata?.['feature-list'] || ''
        const features = product.metadata?.features || ''
        
        // Clean and format the arrays properly
        const marketingFeatures = featureList
          ? featureList.split(',')
              .map(f => f.trim())
              .filter(f => f) // Remove empty strings
              .map(f => f.replace(/"/g, '\\"')) // Escape any quotes
          : []
        
        const productFeatures = features
          ? features.split(',')
              .map(f => f.trim())
              .filter(f => f)
              .map(f => f.replace(/"/g, '\\"'))
          : []
        
        console.log('Parsed marketing features:', marketingFeatures)
        console.log('Parsed product features:', productFeatures)
        
        const { data: upsertResult, error: productError } = await supabase
          .from('products')
          .upsert({
            id: product.id,
            active: product.active,
            name: product.name,
            description: product.description,
            features: productFeatures,
            marketing_features: marketingFeatures,
            image: product.images?.[0] ?? null,
            created: new Date(product.created * 1000).toISOString()
          })
          .select()

        if (productError) {
          throw new Error(`Error upserting product: ${JSON.stringify(productError)}`)
        }
        console.log('Product upsert result:', upsertResult)

        // If there's a default price, sync it too
        if (product.default_price && typeof product.default_price !== 'string') {
          const price = product.default_price
          console.log('Processing price:', price.id)
          
          const { data: priceResult, error: priceError } = await supabase
            .from('prices')
            .upsert({
              id: price.id,
              product_id: product.id,
              active: price.active,
              currency: price.currency,
              type: price.type,
              unit_amount: price.unit_amount,
              interval: price.recurring?.interval ?? null,
              interval_count: price.recurring?.interval_count ?? null,
              trial_period_days: price.recurring?.trial_period_days ?? null
            })
            .select()

          if (priceError) {
            throw new Error(`Error upserting price: ${JSON.stringify(priceError)}`)
          }
          console.log('Price upsert result:', priceResult)
        }
      } catch (productError) {
        console.error('Error processing product:', product.id, productError)
        throw productError
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      synced: products.length,
      products: products.map(p => ({ 
        id: p.id, 
        name: p.name,
        metadata: p.metadata,
        marketingFeatures: p.metadata?.['feature-list']
      }))
    }), {
      status: 200
    })
  } catch (error) {
    console.error('Sync error:', error)
    return new Response(JSON.stringify({ 
      error: 'Sync failed', 
      details: error instanceof Error ? error.message : JSON.stringify(error)
    }), {
      status: 500
    })
  }
} 
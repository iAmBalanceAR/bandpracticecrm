import { createClient } from '@/utils/supabase/server'
//import type { Database } from '@/types/supabase'
import { PricingClient } from '@/components/pricing/pricing-client'

export default async function Pricing() {
  const supabase = createClient()
  
  // Fetch active products with their prices
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(`
      *,
      prices (
        *
      )
    `)
    .eq('active', true)
    .eq('prices.active', true)
    .order('metadata->index')

  if (productsError) {
    console.error('Error fetching products:', productsError)
  }

  // Don't try to get user/session for pricing page
  return (
    <div>
      <PricingClient products={products || []} user={null} />
    </div>
  )
} 
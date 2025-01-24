import { createClient } from '@/utils/supabase/server'
//import type { Database } from '@/types/supabase'
import { PricingClient } from '@/components/pricing/pricing-client'

export default async function Pricing() {
  const supabase = createClient()
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.error('Error fetching user:', userError)
  }

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

  return (
    <div>
      <PricingClient products={products || []} user={user} />
    </div>
  )
} 
import { createClient } from '@/utils/supabase/server'
//import type { Database } from '@/types/supabase'
import { PricingClient } from '@/components/pricing/pricing-client'

export default async function Pricing() {
  const supabase = createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's subscription status if logged in
  let userSubscription = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, stripe_customer_id')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      userSubscription = {
        status: profile.subscription_status,
        stripe_customer_id: profile.stripe_customer_id
      }
    }
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
    .neq('id', 'prod_test')
    .eq('prices.active', true)
    .order('metadata->index')

  if (productsError) {
    console.error('Error fetching products:', productsError)
  }

  return (
    <div>
      <PricingClient 
        products={products || []} 
        user={user} 
        userSubscription={userSubscription}
      />
    </div>
  )
} 
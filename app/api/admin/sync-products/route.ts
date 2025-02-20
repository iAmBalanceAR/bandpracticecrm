import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { stripe } from '@/utils/stripe'
import type { Database } from '@/types/supabase'

export async function POST() {
  const supabase = createClient()

  // Get authenticated user
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // Check admin status from JWT metadata
  const isSuperAdmin = user?.app_metadata?.is_super_admin // From raw_app_meta_data
  
  if (error || !isSuperAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  try {
    // Your existing sync logic here
    const products = await stripe.products.list({ active: true })
    const prices = await stripe.prices.list({ active: true })
    
    // ... rest of your sync script code ...

    return NextResponse.json({
      message: `Synced ${products.data.length} products and ${prices.data.length} prices`
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    )
  }
}
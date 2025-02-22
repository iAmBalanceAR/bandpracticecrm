import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { stripe } from '@/utils/stripe'

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
    // Get the most recent subscription with trial info
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('trial_start, trial_end')
      .order('created', { ascending: false })
      .limit(1)
      .single()

    if (subscriptionError) {
      return NextResponse.json(
        { error: 'Failed to fetch subscription data' },
        { status: 500 }
      )
    }

    return NextResponse.json(subscriptionData)
  } catch (error) {
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    )
  }
}
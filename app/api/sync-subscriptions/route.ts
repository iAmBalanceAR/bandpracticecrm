import { createClient } from '@/utils/supabase/server'
import { stripe } from '@/utils/stripe'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Get all users with stripe_customer_id
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id')
      .not('stripe_customer_id', 'is', null)

    console.log('Found profiles:', profiles)
    if (error) throw error

    for (const profile of profiles || []) {
      console.log('Checking profile:', profile.id)
      
      // Get customer's subscriptions from Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        limit: 1,
      })

      console.log('Found subscriptions:', subscriptions.data)

      // Update profile with latest subscription status
      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0]
        console.log('Updating profile with subscription:', subscription.id, subscription.status)
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: subscription.status,
            stripe_subscription_id: subscription.id
          })
          .eq('id', profile.id)

        if (updateError) {
          console.error('Update error:', updateError)
        }
      } else {
        console.log('No active subscriptions found for profile:', profile.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
} 
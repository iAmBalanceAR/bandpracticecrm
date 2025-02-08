import { createClient } from '@/utils/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { stripe } from '@/utils/stripe'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {}
      }
    }
  )

  try {
    console.log('Starting subscription sync...')
    
    // First, get all subscriptions from Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      expand: ['data.default_payment_method']
    })
    
    console.log(`Found ${stripeSubscriptions.data.length} subscriptions in Stripe:`)
    stripeSubscriptions.data.forEach(sub => {
      console.log(`- Subscription ${sub.id}:`)
      console.log(`  Status: ${sub.status}`)
      console.log(`  Customer: ${sub.customer}`)
      console.log(`  Metadata:`, sub.metadata)
    })

    const results = {
      subscriptionsCreated: 0,
      subscriptionsUpdated: 0,
      profilesUpdated: 0,
      errors: [] as any[]
    }

    // Process each Stripe subscription
    for (const stripeSub of stripeSubscriptions.data) {
      try {
        const supabaseUserId = stripeSub.metadata?.supabase_user_id
        if (!supabaseUserId) {
          console.warn(`No supabase_user_id found in metadata for subscription ${stripeSub.id}`)
          continue
        }

        console.log(`Processing subscription ${stripeSub.id} for user ${supabaseUserId}`)

        // Prepare subscription data
        const subscriptionData = {
          id: stripeSub.id,
          user_id: supabaseUserId,
          status: stripeSub.status,
          metadata: stripeSub.metadata?.supabase_user_id ? { supabase_user_id: stripeSub.metadata.supabase_user_id } : null,
          price_id: stripeSub.items.data[0]?.price.id,
          quantity: stripeSub.items.data[0]?.quantity,
          cancel_at_period_end: stripeSub.cancel_at_period_end,
          cancel_at: stripeSub.cancel_at ? new Date(stripeSub.cancel_at * 1000).toISOString() : null,
          canceled_at: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000).toISOString() : null,
          current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
          created: new Date(stripeSub.created * 1000).toISOString(),
          ended_at: stripeSub.ended_at ? new Date(stripeSub.ended_at * 1000).toISOString() : null,
          trial_start: stripeSub.trial_start ? new Date(stripeSub.trial_start * 1000).toISOString() : null,
          trial_end: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000).toISOString() : null
        }

        console.log('Upserting subscription data:', subscriptionData)

        // Upsert to subscriptions table
        const { error: subscriptionError } = await supabaseAdmin
          .from('subscriptions')
          .upsert(subscriptionData)

        if (subscriptionError) {
          console.error('Error upserting subscription:', subscriptionError)
          results.errors.push({ type: 'subscription', id: stripeSub.id, error: subscriptionError })
          continue
        }

        console.log(`Successfully upserted subscription ${stripeSub.id}`)
        results.subscriptionsUpdated++

        // Update the profile with correct customer ID and subscription info
        const profileUpdate = {
          stripe_customer_id: stripeSub.customer as string,
          subscription_id: stripeSub.id,
          subscription_status: stripeSub.status,
          subscription_price_id: stripeSub.items.data[0]?.price.id
        }
        console.log(`Updating profile ${supabaseUserId} with:`, profileUpdate)

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update(profileUpdate)
          .eq('id', supabaseUserId)

        if (profileError) {
          console.error('Error updating profile:', profileError)
          results.errors.push({ type: 'profile', id: supabaseUserId, error: profileError })
        } else {
          console.log(`Successfully updated profile ${supabaseUserId}`)
          results.profilesUpdated++
        }

      } catch (error: any) {
        console.error(`Error processing subscription ${stripeSub.id}:`, error)
        results.errors.push({ type: 'general', id: stripeSub.id, error: error.message })
      }
    }

    console.log('Sync completed with results:', results)

    return NextResponse.json({
      success: true,
      stripeSubscriptions: stripeSubscriptions.data.length,
      results
    })

  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 
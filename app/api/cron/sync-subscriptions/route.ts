import { NextResponse } from 'next/server'
import { stripe } from '@/utils/stripe'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Verify the request is from a legitimate cron job
function isValidCronRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('CRON_SECRET is not set')
    return false
  }

  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: Request) {
  // Verify this is a legitimate cron request
  if (!isValidCronRequest(request)) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    console.log('Starting scheduled subscription sync...')
    
    // Fetch all subscriptions from Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      expand: ['data.default_payment_method']
    })
    
    console.log(`Found ${stripeSubscriptions.data.length} subscriptions in Stripe`)

    const results = {
      processed: 0,
      updated: 0,
      errors: [] as any[]
    }

    // Process each subscription
    for (const stripeSub of stripeSubscriptions.data) {
      try {
        const supabaseUserId = stripeSub.metadata?.supabase_user_id
        if (!supabaseUserId) {
          console.warn(`No supabase_user_id found in metadata for subscription ${stripeSub.id}`)
          continue
        }

        // Prepare subscription data
        const subscriptionData = {
          id: stripeSub.id,
          user_id: supabaseUserId,
          status: stripeSub.status,
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
          trial_end: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000).toISOString() : null,
          metadata: stripeSub.metadata
        }

        // Upsert subscription
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .upsert([subscriptionData])

        if (subscriptionError) {
          throw subscriptionError
        }

        // Update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_status: stripeSub.status,
            subscription_price_id: stripeSub.items.data[0]?.price.id,
            subscription_id: stripeSub.id,
            stripe_customer_id: stripeSub.customer as string
          })
          .eq('id', supabaseUserId)

        if (profileError) {
          throw profileError
        }

        results.updated++
      } catch (error: any) {
        console.error(`Error processing subscription ${stripeSub.id}:`, error)
        results.errors.push({
          subscription_id: stripeSub.id,
          error: error.message
        })
      }
      results.processed++
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })

  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error.message },
      { status: 500 }
    )
  }
}

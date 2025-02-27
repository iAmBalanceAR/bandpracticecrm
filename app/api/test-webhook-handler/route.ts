import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import Stripe from 'stripe'

// This is a test-only endpoint that simulates Stripe webhook processing
// without requiring a valid signature
export async function POST(req: Request) {
  try {
    // Parse the webhook payload
    const body = await req.json()
    
    console.log('Test webhook received:', {
      eventType: body.type,
      objectId: body.data?.object?.id
    })
    
    // Create Supabase client
    const supabase = createServerClient(
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
    
    // Process the event based on type
    switch (body.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = body.data.object as Stripe.Subscription
        
        console.log('Processing subscription event:', {
          id: subscription.id,
          status: subscription.status,
          priceId: subscription.items?.data[0]?.price?.id,
          customerId: subscription.customer,
          metadata: subscription.metadata
        })
        
        // Get user ID from subscription metadata
        let userId = subscription.metadata?.supabase_user_id
        
        if (!userId) {
          return NextResponse.json({
            error: 'No user ID found in subscription metadata',
            status: 'failed'
          }, { status: 400 })
        }
        
        // First, check if the price exists in the database
        const priceId = subscription.items?.data[0]?.price?.id
        
        if (!priceId) {
          return NextResponse.json({
            error: 'No price ID found in subscription',
            status: 'failed'
          }, { status: 400 })
        }
        
        const { data: existingPrice } = await supabase
          .from('prices')
          .select('id')
          .eq('id', priceId)
          .single()
        
        // If price doesn't exist, create a temporary one for testing
        if (!existingPrice) {
          console.log('Price not found in database, creating temporary price:', priceId)
          
          // Create a product if needed
          const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('id', 'prod_test')
            .single()
            
          if (!existingProduct) {
            const { error: productError } = await supabase
              .from('products')
              .insert({
                id: 'prod_test',
                name: 'Test Product',
                active: true,
                description: 'Created for testing'
              })
              
            if (productError) {
              return NextResponse.json({
                error: productError,
                status: 'failed',
                step: 'product-creation'
              }, { status: 400 })
            }
          }
          
          // Create the price
          const { error: priceError } = await supabase
            .from('prices')
            .insert({
              id: priceId,
              product_id: 'prod_test',
              active: true,
              currency: 'usd',
              type: 'recurring',
              unit_amount: 1000,
              interval: subscription.items?.data[0]?.price?.recurring?.interval || 'month',
              interval_count: subscription.items?.data[0]?.price?.recurring?.interval_count || 1
            })
            
          if (priceError) {
            return NextResponse.json({
              error: priceError,
              status: 'failed',
              step: 'price-creation'
            }, { status: 400 })
          }
        }
        
        // Helper function to safely convert timestamps to ISO strings
        const safeTimestampToISO = (timestamp: number | null | undefined): string | null => {
          if (!timestamp) return null;
          
          try {
            // Ensure timestamp is a number and valid
            const timestampNum = Number(timestamp);
            if (isNaN(timestampNum) || timestampNum <= 0) return null;
            
            // Convert to ISO string
            return new Date(timestampNum * 1000).toISOString();
          } catch (e) {
            console.error('Invalid timestamp:', timestamp, e);
            return null;
          }
        };
        
        // Create subscription data with safe timestamp conversions
        const subscriptionData = {
          id: subscription.id,
          user_id: userId,
          status: subscription.status,
          price_id: priceId,
          quantity: subscription.items.data[0]?.quantity,
          cancel_at_period_end: subscription.cancel_at_period_end,
          cancel_at: safeTimestampToISO(subscription.cancel_at),
          canceled_at: safeTimestampToISO(subscription.canceled_at),
          current_period_start: safeTimestampToISO(subscription.current_period_start),
          current_period_end: safeTimestampToISO(subscription.current_period_end),
          created: safeTimestampToISO(subscription.created),
          ended_at: safeTimestampToISO(subscription.ended_at),
          trial_start: safeTimestampToISO(subscription.trial_start),
          trial_end: safeTimestampToISO(subscription.trial_end),
          metadata: subscription.metadata
        }
        
        // Validate required timestamp fields
        if (!subscriptionData.current_period_start || !subscriptionData.current_period_end || !subscriptionData.created) {
          return NextResponse.json({
            error: 'Missing or invalid required timestamp fields',
            status: 'failed',
            invalidFields: {
              current_period_start: !subscriptionData.current_period_start,
              current_period_end: !subscriptionData.current_period_end,
              created: !subscriptionData.created
            },
            rawValues: {
              current_period_start: subscription.current_period_start,
              current_period_end: subscription.current_period_end,
              created: subscription.created
            }
          }, { status: 400 })
        }
        
        // Upsert the subscription
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .upsert(subscriptionData)
          
        if (subscriptionError) {
          return NextResponse.json({
            error: subscriptionError,
            status: 'failed',
            step: 'subscription-upsert',
            subscriptionData
          }, { status: 400 })
        }
        
        // Update the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_status: subscription.status,
            subscription_id: subscription.id,
            subscription_price_id: priceId
          })
          .eq('id', userId)
          
        if (profileError) {
          return NextResponse.json({
            error: profileError,
            status: 'failed',
            step: 'profile-update'
          }, { status: 400 })
        }
        
        return NextResponse.json({
          status: 'success',
          message: 'Subscription processed successfully',
          subscription: {
            id: subscription.id,
            status: subscription.status,
            priceId: priceId
          }
        })
      }
      
      default:
        return NextResponse.json({
          status: 'skipped',
          message: `Event type ${body.type} not handled by test webhook`
        })
    }
  } catch (error: any) {
    console.error('Error in test webhook handler:', error)
    return NextResponse.json({
      error: error.message,
      status: 'error'
    }, { status: 500 })
  }
} 
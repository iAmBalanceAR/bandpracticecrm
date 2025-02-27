import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { stripe, createOrRetrieveCustomer } from '@/utils/stripe'
import { getURL } from '@/utils/get-url'

interface CheckoutRequest {
  priceId: string
}

export async function POST(request: Request) {
  try {
    // Verify Stripe is initialized
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key is not configured')
      return new NextResponse('Stripe configuration error', { status: 500 })
    }

    // Parse request body
    const body = await request.json()
    console.log('Request body:', body)

    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Auth error:', userError)
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('User found:', user.id)
    console.log('Creating checkout session with:', {
      priceId: body.priceId,
      customerId: user.id,
      siteUrl: getURL()
    })

    let { priceId } = body as CheckoutRequest

    if (!priceId) {
      console.error('No priceId provided')
      return new NextResponse('Price ID is required', { status: 400 })
    }

    // Trim any whitespace or newlines from the price ID
    priceId = priceId.trim()
    console.log('Cleaned priceId:', priceId)

    console.log('Creating/retrieving customer for user:', user.id)
    // Get or create customer
    const customerId = await createOrRetrieveCustomer(user.id, user.email!, user.user_metadata?.full_name)
    console.log('Customer ID:', customerId)

    console.log('Creating session with metadata:', {
      userId: user.id,
      customerId,
      priceId
    })

    // Get the site URL using the getURL function
    const baseUrl = getURL()

    // Create a checkout session with the latest Stripe best practices
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing/cancelled`,
      subscription_data: {
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel'
          }
        },
        trial_period_days: 7,
        metadata: {
          supabase_user_id: user.id,
        },
      },
      payment_method_collection: 'if_required',
      metadata: {
        supabase_user_id: user.id
      },
      custom_text: {
        submit: {
          message: "Start your 7-day free trial - no credit card required. You'll only be asked for payment details when your trial ends."
        }
      },
      allow_promotion_codes: true,
      //automatic_tax: { enabled: true }
    })

    if (!session?.url) {
      console.error('No session URL returned from Stripe')
      return new NextResponse('Could not create checkout session', { status: 500 })
    }

    console.log('Checkout session created:', {
      sessionId: session.id,
      metadata: session.metadata,
      subscription: session.subscription
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    // Log the full error details
    console.error('Detailed checkout error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined,
      error
    })
    
    // Check for specific Stripe errors
    if (error instanceof Error && error.message.includes('Stripe')) {
      return new NextResponse(`Stripe Error: ${error.message}`, { status: 500 })
    }
    
    return new NextResponse(error instanceof Error ? error.message : 'Internal Error', { status: 500 })
  }
}
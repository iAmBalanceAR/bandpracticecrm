import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { stripe, createOrRetrieveCustomer } from '@/utils/stripe'

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
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL
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

    // Ensure site URL is properly formatted
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const baseUrl = siteUrl.startsWith('http') 
      ? siteUrl 
      : `https://${siteUrl.replace(/^\/+/, '')}`

    // Create a checkout session
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
        metadata: {
          supabase_user_id: user.id,
        },
      },
      metadata: {
        supabase_user_id: user.id
      }
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
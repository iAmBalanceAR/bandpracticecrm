import { NextResponse } from 'next/server'
import { stripe } from '@/utils/stripe'

export async function GET(request: Request) {
  try {
    // Get the session ID from query parameters
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      console.error('[Stripe Session] Error: No session ID provided')
      return new NextResponse('Session ID is required', { status: 400 })
    }

    console.log(`[Stripe Session] Retrieving session: ${sessionId}`)

    // Retrieve the session with expanded customer data
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription']
    })

    console.log(`[Stripe Session] Successfully retrieved session: ${sessionId}`)

    // Return the necessary data
    return NextResponse.json({
      customer_email: session.customer_details?.email,
      customer_details: session.customer_details,
      customer: session.customer,
      subscription: session.subscription
    })
  } catch (error) {
    console.error('[Stripe Session] Error retrieving session:', error)
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Error',
      { status: 500 }
    )
  }
} 
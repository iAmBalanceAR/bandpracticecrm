import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(req: Request) {
  try {
    const { userId, priceId } = await req.json()

    if (!userId || !priceId) {
      return new NextResponse('Missing required parameters', { status: 400 })
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/canceled`,
      metadata: {
        supabase_user_id: userId,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
        },
      },
    })

    return new NextResponse(JSON.stringify({ url: session.url }))
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new NextResponse(
      `Error creating checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    )
  }
} 
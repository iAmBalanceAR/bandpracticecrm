import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { stripe, createOrRetrieveCustomer } from '@/utils/stripe'

interface CheckoutRequest {
  priceId: string
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { priceId } = await request.json() as CheckoutRequest

    if (!priceId) {
      return new NextResponse('Price ID is required', { status: 400 })
    }

    // Get or create customer
    const customerId = await createOrRetrieveCustomer(user.id, user.email!, user.user_metadata?.full_name)

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
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Checkout error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 
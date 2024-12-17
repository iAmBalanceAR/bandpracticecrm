import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createCheckoutSession, createOrRetrieveCustomer } from '@/utils/stripe'
import type { Database } from '@/types/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const priceId = searchParams.get('priceId')

    if (!priceId) {
      return NextResponse.json(
        { message: 'Price ID is required' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create customer
    const customerId = await createOrRetrieveCustomer(
      user.id,
      user.email!,
      user.user_metadata?.full_name
    )

    // Create checkout session
    const checkoutSession = await createCheckoutSession(
      customerId,
      priceId,
      process.env.NEXT_PUBLIC_SITE_URL!
    )

    if (!checkoutSession?.url) {
      return NextResponse.json(
        { message: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    // Log the session details for debugging
    console.log('Checkout Session Created:', {
      id: checkoutSession.id,
      url: checkoutSession.url,
      customerId,
      priceId
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Error in checkout route:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 
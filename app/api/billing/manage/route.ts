import { createBillingPortalSession } from '@/utils/stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const { customerStripeId } = await request.json()

    if (!customerStripeId) {
      return NextResponse.json(
        { error: 'Missing customer ID' },
        { status: 400 }
      )
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!siteUrl) {
      throw new Error('Missing NEXT_PUBLIC_SITE_URL environment variable')
    }

    const session = await createBillingPortalSession(
      customerStripeId,
      `${siteUrl}/account/billing`
    )

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Error creating billing portal session:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
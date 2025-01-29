import { NextResponse } from 'next/server'
import { stripe } from '@/utils/stripe'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return new NextResponse('Session ID is required', { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer']
    })

    return NextResponse.json({
      customer_email: session.customer_details?.email,
      customer_details: session.customer_details,
      customer: session.customer
    })
  } catch (error) {
    console.error('Error retrieving session:', error)
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Error',
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    })

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    // Check if webhook secret is configured
    if (!webhookSecret) {
      return NextResponse.json({
        error: 'Webhook secret is not configured',
        status: 'failed'
      }, { status: 400 })
    }

    // Check if signature is provided
    if (!signature) {
      return NextResponse.json({
        error: 'No signature provided in request headers',
        status: 'failed'
      }, { status: 400 })
    }

    // Try to construct the event to verify the signature
    try {
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      
      return NextResponse.json({
        status: 'success',
        message: 'Webhook signature verification successful',
        eventType: event.type,
        eventId: event.id,
        livemode: event.livemode
      })
    } catch (error: any) {
      return NextResponse.json({
        error: error.message,
        status: 'failed',
        message: 'Webhook signature verification failed'
      }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      status: 'error',
      message: 'Server error while verifying webhook'
    }, { status: 500 })
  }
} 
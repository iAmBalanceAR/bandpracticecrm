import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET() {
  try {
    // Initialize Stripe with the current key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    })

    // Get the key info
    const keyInfo = {
      key: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...',
      isLiveMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_'),
      isTestMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'),
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'Configured' : 'Missing',
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 8) + '...',
      publishableKeyIsLive: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_'),
      publishableKeyIsTest: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_')
    }

    // Try to list a customer to verify the key works
    let stripeKeyWorks = false
    let stripeError = null
    let environment = null

    try {
      // List a single customer to verify the key works
      const customers = await stripe.customers.list({ limit: 1 })
      stripeKeyWorks = true
      environment = customers.data[0]?.livemode ? 'live' : 'test'
    } catch (error: any) {
      stripeError = {
        message: error.message,
        type: error.type,
        code: error.code
      }
    }

    // Return the results
    return NextResponse.json({
      keyInfo,
      stripeKeyWorks,
      environment,
      stripeError,
      message: stripeKeyWorks 
        ? `Stripe key is valid and configured for ${environment} mode` 
        : 'Stripe key verification failed'
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      message: 'Failed to check Stripe keys'
    }, { status: 500 })
  }
} 
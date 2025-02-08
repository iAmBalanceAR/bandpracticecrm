'use server'

import { redirect } from 'next/navigation'
import { createBillingPortalSession } from '@/utils/stripe'

export async function handleManageSubscription(formData: FormData) {
  const customerStripeId = formData.get('customerStripeId') as string
  console.log('Debug - Manage Subscription:', { customerStripeId })
  
  if (!customerStripeId) {
    throw new Error('No Stripe customer ID found')
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    throw new Error('Missing NEXT_PUBLIC_SITE_URL environment variable')
  }
  
  try {
    const session = await createBillingPortalSession(customerStripeId, siteUrl)
    redirect(session.url)
  } catch (error: any) {
    console.error('Error creating billing portal session:', {
      error: error.message,
      type: error.type,
      code: error.code,
      customerStripeId
    })
    throw error
  }
}

export async function handleCancelSubscription(formData: FormData) {
  const customerStripeId = formData.get('customerStripeId') as string
  console.log('Debug - Cancel Subscription:', { customerStripeId })
  
  if (!customerStripeId) {
    throw new Error('No Stripe customer ID found')
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    throw new Error('Missing NEXT_PUBLIC_SITE_URL environment variable')
  }

  try {
    const session = await createBillingPortalSession(
      customerStripeId,
      `${siteUrl}/account/billing?action=cancel`
    )
    redirect(session.url)
  } catch (error: any) {
    console.error('Error creating billing portal session for cancellation:', {
      error: error.message,
      type: error.type,
      code: error.code,
      customerStripeId
    })
    throw error
  }
} 
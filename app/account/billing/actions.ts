'use server'

import { redirect } from 'next/navigation'
import { createBillingPortalSession } from '@/utils/stripe'

export async function handleManageSubscription(formData: FormData) {
  const customerStripeId = formData.get('customerStripeId') as string
  if (!customerStripeId) {
    throw new Error('No Stripe customer ID found')
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    throw new Error('Missing NEXT_PUBLIC_SITE_URL environment variable')
  }
  
  const session = await createBillingPortalSession(customerStripeId, siteUrl)
  redirect(session.url)
}

export async function handleCancelSubscription(formData: FormData) {
  const customerStripeId = formData.get('customerStripeId') as string
  if (!customerStripeId) {
    throw new Error('No Stripe customer ID found')
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    throw new Error('Missing NEXT_PUBLIC_SITE_URL environment variable')
  }

  const session = await createBillingPortalSession(
    customerStripeId,
    `${siteUrl}/account/billing?action=cancel`
  )
  
  redirect(session.url)
} 
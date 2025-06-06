import Stripe from 'stripe'
import { getURL } from './get-url'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as const,
  typescript: true,
})

export async function createOrRetrieveCustomer(
  uuid: string,
  email: string,
  name?: string
) {
  const customers = await stripe.customers.list({
    email,
  })

  if (customers.data.length > 0) {
    const customer = customers.data[0]
    if (!customer.metadata.supabase_user_id) {
      await stripe.customers.update(customer.id, {
        metadata: {
          supabase_user_id: uuid,
        },
      })
    }
    return customer.id
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      supabase_user_id: uuid,
    },
  })

  return customer.id
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  returnUrl?: string
) {
  // Use the provided returnUrl or get the default URL
  const baseUrl = returnUrl || getURL()

  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/cancelled`,
  })

  return checkout
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl?: string
) {
  // Use the provided returnUrl or get the default URL
  const baseUrl = returnUrl || getURL()
  
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: baseUrl,
  })

  return portalSession
} 
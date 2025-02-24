'use server'

import { createClient } from '@/utils/supabase/server'
import { stripe } from '@/utils/stripe'
import { revalidatePath } from 'next/cache'

export async function updateSubscription(formData: FormData) {
  const supabase = createClient()
  const priceId = formData.get('priceId') as string
  const subscriptionId = formData.get('subscriptionId') as string
  
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: priceId,
      }],
      proration_behavior: 'always_invoice',
    })

    revalidatePath('/account/billing')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating subscription:', error)
    return { error: error.message }
  }
}

export async function cancelSubscription(formData: FormData) {
  const subscriptionId = formData.get('subscriptionId') as string
  
  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    })

    revalidatePath('/account/billing')
    return { success: true }
  } catch (error: any) {
    console.error('Error canceling subscription:', error)
    return { error: error.message }
  }
}

export async function resumeSubscription(formData: FormData) {
  const subscriptionId = formData.get('subscriptionId') as string
  
  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    })

    revalidatePath('/account/billing')
    return { success: true }
  } catch (error: any) {
    console.error('Error resuming subscription:', error)
    return { error: error.message }
  }
}

export async function updatePaymentMethod(formData: FormData) {
  const paymentMethodId = formData.get('paymentMethodId') as string
  const customerId = formData.get('customerId') as string

  try {
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    revalidatePath('/account/billing')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating payment method:', error)
    return { error: error.message }
  }
}

export async function removePaymentMethod(formData: FormData) {
  const paymentMethodId = formData.get('paymentMethodId') as string
  
  try {
    await stripe.paymentMethods.detach(paymentMethodId)
    revalidatePath('/account/billing')
    return { success: true }
  } catch (error: any) {
    console.error('Error removing payment method:', error)
    return { error: error.message }
  }
} 
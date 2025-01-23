import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createBillingPortalSession } from '@/utils/stripe'
import { Card } from '@/components/ui/card'

async function handleManageSubscription(customerStripeId: string) {
  'use server'

  if (!customerStripeId) {
    throw new Error('No Stripe customer ID found')
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!siteUrl) {
    throw new Error('Missing NEXT_PUBLIC_SITE_URL environment variable')
  }
  
  const session = await createBillingPortalSession(
    customerStripeId,
    siteUrl
  )
  
  redirect(session.url)
}

export default async function BillingPage() {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/auth/signin')
  }

  // Get profile and related subscription data
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      stripe_customer_id,
      subscription_status,
      subscription_price_id,
      subscriptions (
        current_period_start,
        current_period_end,
        cancel_at_period_end
      ),
      prices (
        id,
        unit_amount,
        currency,
        interval,
        products (
          name
        )
      )
    `)
    .eq('id', user.id)
    .single()

  // Format subscription details
  const subscription = profile?.subscriptions?.[0]
  const price = profile?.prices?.[0]
  const product = price?.products?.[0]

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatPrice = (amount?: number, currency?: string) => {
    if (!amount || !currency) return ''
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0
    }).format(amount / 100)
  }

  return (
    <div className="pl-4 pt-3 bg-[#0f1729] text-white min-h-screen">
      <h1 className="text-4xl font-mono mb-4">
        <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          Billing & Subscription
        </span>
      </h1>
      <div className="border-[#ff9920] border-b-2 -mt-8 mb-4 w-[100%] h-4"></div>
      
      <div className="pr-6 pl-8 pb-6 pt-4 bg-[#131d43] text-white min-h-[500px] shadow-sm shadow-green-400 rounded-md border-blue-800 border">
        <Card className="bg-[#1B2559] border-blue-800">
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-[#111c44] rounded-lg border border-blue-800">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">Current Plan</h3>
                  <p className="text-gray-400 text-sm">
                    {product?.name || 'No active plan'}
                  </p>
                  {profile?.subscription_status && (
                    <>
                      <p className="text-gray-400 text-sm">
                        Status: <span className="text-green-400 capitalize">{profile.subscription_status}</span>
                      </p>
                      {price && (
                        <p className="text-gray-400 text-sm">
                          {formatPrice(price.unit_amount, price.currency)}/{price.interval}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {subscription && (
                <div className="flex justify-between items-center p-4 bg-[#111c44] rounded-lg border border-blue-800">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-white">Billing Period</h3>
                    <p className="text-gray-400 text-sm">
                      Current period: {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                    </p>
                    {subscription.cancel_at_period_end && (
                      <p className="text-yellow-400 text-sm">
                        Your subscription will end on {formatDate(subscription.current_period_end)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center p-4 bg-[#111c44] rounded-lg border border-blue-800">
                <div>
                  <h3 className="text-lg font-medium text-white">Subscription Management</h3>
                  <p className="text-gray-400 text-sm">
                    {profile?.stripe_customer_id 
                      ? 'Manage your subscription, payment methods, and billing history'
                      : 'View available subscription plans'}
                  </p>
                </div>
                {profile?.stripe_customer_id ? (
                  <form action={handleManageSubscription.bind(null, profile.stripe_customer_id)}>
                    <Button 
                      type="submit"
                      className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                    >
                      Manage Subscription
                    </Button>
                  </form>
                ) : (
                  <Button 
                    asChild
                    className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                  >
                    <a href="/pricing">View Plans</a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 
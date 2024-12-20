import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createBillingPortalSession } from '@/utils/stripe'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, subscription_status')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-2xl font-bold text-card-foreground">Billing & Subscription</h2>
            <div className="mt-6 border-t border-border pt-6">
              <dl className="divide-y divide-border">
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-card-foreground">Subscription Status</dt>
                  <dd className="mt-1 text-sm text-muted-foreground sm:col-span-2 sm:mt-0">
                    {profile?.subscription_status || 'No active subscription'}
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-card-foreground">Actions</dt>
                  <dd className="mt-1 text-sm text-muted-foreground sm:col-span-2 sm:mt-0">
                    {profile?.stripe_customer_id ? (
                      <form action={handleManageSubscription.bind(null, profile.stripe_customer_id)}>
                        <Button type="submit">
                          Manage Subscription
                        </Button>
                      </form>
                    ) : (
                      <Button asChild>
                        <a href="/pricing">View Plans</a>
                      </Button>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
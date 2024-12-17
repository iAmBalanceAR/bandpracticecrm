import React from 'react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createBillingPortalSession } from '@/utils/stripe'
import type { Database } from '@/types/supabase'

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
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/auth/signin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/account')
  }

  if (!profile.stripe_customer_id) {
    redirect('/pricing')
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-card-foreground mb-6">Billing Management</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Subscription Status</label>
              <p className="mt-1 text-foreground capitalize">
                {profile.subscription_status ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {profile.subscription_status}
                  </span>
                ) : (
                  'No active subscription'
                )}
              </p>
            </div>
            <form action={async () => {
              'use server'
              await handleManageSubscription(profile.stripe_customer_id!)
            }}>
              <Button type="submit">
                Manage Subscription in Stripe
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 
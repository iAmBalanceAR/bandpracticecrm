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

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, subscription_status')
    .eq('id', user.id)
    .single()

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
                <div>
                  <h3 className="text-lg font-medium text-white">Subscription Status</h3>
                  <p className="text-gray-400 text-sm">
                    {profile?.subscription_status || 'No active subscription'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-[#111c44] rounded-lg border border-blue-800">
                <div>
                  <h3 className="text-lg font-medium text-white">Subscription Management</h3>
                  <p className="text-gray-400 text-sm">
                    {profile?.stripe_customer_id 
                      ? 'Manage your current subscription'
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
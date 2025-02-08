"use client"

import React, { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DangerZone } from '@/components/billing/danger-zone'
import { handleManageSubscription, handleCancelSubscription } from './actions'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BillingPage() {
  const [profile, setProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  React.useEffect(() => {
    async function loadData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          router.push('/auth/signin')
          return
        }

        // Get profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData?.subscription_id) {
          // Get subscription details
          const { data: subscriptionData } = await supabase
            .from('subscriptions')
            .select(`
              *,
              price:price_id (
                *,
                product:product_id (
                  name,
                  features
                )
              )
            `)
            .eq('id', profileData.subscription_id)
            .single()

          if (subscriptionData) {
            console.log('Debug - Subscription Data:', {
              subscriptionId: subscriptionData.id,
              stripeCustomerId: subscriptionData.stripe_customer_id,
              userId: subscriptionData.user_id
            })
            setSubscription(subscriptionData)
            
            // Update profile with stripe_customer_id if it's missing
            if (!profileData.stripe_customer_id && subscriptionData.stripe_customer_id) {
              console.log('Debug - Updating profile with stripe_customer_id:', subscriptionData.stripe_customer_id)
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  stripe_customer_id: subscriptionData.stripe_customer_id
                })
                .eq('id', user.id)

              if (!updateError) {
                profileData.stripe_customer_id = subscriptionData.stripe_customer_id
              } else {
                console.error('Debug - Error updating profile:', updateError)
              }
            }
          } else {
            console.log('Debug - No subscription data found')
          }
        }

        console.log('Debug - Final Profile Data:', {
          profileId: profileData?.id,
          stripeCustomerId: profileData?.stripe_customer_id,
          subscriptionId: profileData?.subscription_id
        })

        setProfile(profileData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

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

  if (loading) {
    return (
      <div className="pl-4 pt-3 bg-[#0f1729] text-white pb-4 ">
        <h1 className="text-4xl font-mono mb-4">
          <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
            Billing & Subscription
          </span>
        </h1>
        <div className="border-[#ff9920] border-b-2 -mt-8 mb-4 w-[98.55%] h-4"></div>
        

        <div className="pr-6 pl-8 pb-6 pt-4 mr-4 bg-[#131d43] text-white min-h-[500px] shadow-sm shadow-green-400 rounded-md border-blue-800 border flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-sm text-gray-400">Loading subscription details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!profile?.subscription_id) {
    return (
      <div className="pl-4 pt-3 bg-[#0f1729] text-white min-h-screen">
        <h1 className="text-4xl font-mono mb-4">
          <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
            Billing & Subscription
          </span>
        </h1>
        <div className="border-[#ff9920] border-b-2 -mt-8 mb-4 w-[100%] h-4"></div>
        
        <div >
        <Card>
          <div>
            <div className="flex items-center justify-between mb-8 border-0">
              <div className="flex items-top space-x-4">
                <div className="space-y-2">
                    <h3 className="text-lg font-medium text-white">Current Plan</h3>
                    <p className="text-gray-400 text-sm">
                      {profile?.stripe_customer_id ? 'No active plan' : 'No subscription'}
                    </p>
                  </div>
                </div>

                <div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Subscription Management</h3>
                    <p className="text-gray-400 text-sm">
                      {profile?.stripe_customer_id ? 'Manage your subscription, payment methods, and billing history' : 'View available subscription plans'}
                    </p>
                  </div>
                  {profile?.stripe_customer_id ? (
                    <div className="flex gap-3">
                      <form action={handleManageSubscription}>
                        <input type="hidden" name="customerStripeId" value={profile.stripe_customer_id} />
                        <Button 
                          type="submit"
                          className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                        >
                          Manage Subscription
                        </Button>
                      </form>
                    </div>
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

  const price = subscription?.price
  const product = price?.product

  return (
    <div className="pl-4 pt-3 bg-[#0f1729] text-white pb-4 pr-4">
      <h1 className="text-4xl font-mono mb-4">
        <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          Billing & Subscription
        </span>
      </h1>
      <div className="border-[#ff9920] border-b-2 -mt-8 mb-4 w-[100%] h-4"></div>
      
      <div className="pr-6 pl-8  pb-4  pt-4 bg-[#131d43] text-white  shadow-sm shadow-green-400 rounded-md border-blue-800 border">
        <Card className="border-0">
          <div className="border-0">
            <div className="">
              <div className="flex justify-between items-center p-4 bg-[#111c44] rounded-lg border border-blue-800">
                <div className="space-x-5">
                  <h3 className="text-lg font-medium text-white">Current Plan</h3>
                  <p className="text-gray-400 text-sm">
                    {product?.name || 'No active plan'}
                  </p>
                  {subscription && (
                    <>
                      <p className="text-gray-400 text-sm">
                        Status: <span className="text-green-400 capitalize">{subscription.status}</span>
                      </p>
                      {price && (
                        <p className="text-gray-400 text-sm">
                          {formatPrice(price.unit_amount, price.currency)}/{price.interval}
                        </p>
                      )}
                      {product?.features && product.features.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-[#008ffb] mb-1">Plan Features:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {product.features.map((feature: string, index: number) => (
                              <li key={index} className="text-sm text-gray-400/90">
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {subscription && (
                <div className="flex justify-between items-center mt-4 p-4 bg-[#111c44] rounded-lg border border-blue-800">
                  <div className="space-y-5">
                    <h3 className="text-lg font-medium text-white">Billing Period</h3>
                    <p className="text-gray-400 text-sm">
                      Current period: {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                    </p>
                    {subscription.trial_end && (
                      <p className="text-[#008ffb] text-sm">
                        Trial ends: {formatDate(subscription.trial_end)}
                      </p>
                    )}
                    {subscription.cancel_at_period_end && (
                      <p className="text-yellow-400 text-sm">
                        Your subscription will end on {formatDate(subscription.current_period_end)}
                      </p>
                    )}
                    <p className="text-gray-400 text-sm">
                      Next billing date: {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mt-4 p-4 bg-[#111c44] rounded-lg border border-blue-800">
                <div>
                  <h3 className="text-lg font-medium text-white">Subscription Management</h3>
                  <p className="text-gray-400 text-sm">
                    {profile?.stripe_customer_id ? 'Manage your subscription, payment methods, and billing history' : 'View available subscription plans'}
                  </p>
                </div>
                {profile?.stripe_customer_id ? (
                  <div className="flex gap-3">
                    <form action={handleManageSubscription}>
                      <input type="hidden" name="customerStripeId" value={profile.stripe_customer_id} />
                      <Button 
                        type="submit"
                        className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                      >
                        Manage Subscription
                      </Button>
                    </form>
                  </div>
                ) : (
                  <Button 
                    asChild
                    className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                  >
                    <a href="/pricing">View Plans</a>
                  </Button>
                )}
              </div>

              {console.log('Debug Danger Zone:', {
                hasSubscription: !!subscription,
                subscriptionStatus: subscription?.status,
                cancelAtPeriodEnd: subscription?.cancel_at_period_end,
                stripeCustomerId: profile?.stripe_customer_id,
                subscription: subscription
              })}

              {subscription && !subscription.cancel_at_period_end && profile?.stripe_customer_id && (
                <DangerZone
                  customerStripeId={profile.stripe_customer_id}
                  subscriptionEndDate={formatDate(subscription.current_period_end)}
                  onCancel={handleCancelSubscription}
                />
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 
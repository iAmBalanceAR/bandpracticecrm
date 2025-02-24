"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, CreditCard, Receipt, AlertTriangle, X, Download } from 'lucide-react'
import {
  updateSubscription,
  cancelSubscription,
  resumeSubscription,
  updatePaymentMethod,
  removePaymentMethod
} from './actions'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { AccountNav } from '@/components/account/account-nav'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function AddPaymentMethodForm({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    const { error: submitError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/account/billing`,
      }
    })

    if (submitError) {
      setError(submitError.message ?? 'An error occurred')
      setProcessing(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-[#0f1729] rounded-lg border border-blue-900">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Add Payment Method</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <PaymentElement />
      
      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      
      <div className="mt-4 flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || processing}
          className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Add Payment Method'
          )}
        </Button>
      </div>
    </form>
  )
}

export default function BillingPage() {
  const [profile, setProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showCardInput, setShowCardInput] = useState(false)
  const [setupIntent, setSetupIntent] = useState<{ clientSecret: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          console.error('Auth error:', userError)
          router.push('/auth/signin')
          return
        }

        // Get profile with subscription details
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Profile error:', profileError)
          return
        }

        console.log('Debug - Profile:', {
          id: profileData?.id,
          stripeCustomerId: profileData?.stripe_customer_id,
          subscriptionId: profileData?.subscription_id
        })

        setProfile(profileData)
        
        if (profileData?.subscription_id) {
          // Get subscription details
          const { data: subscriptionData, error: subscriptionError } = await supabase
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

          if (subscriptionError) {
            console.error('Subscription error:', subscriptionError)
            return
          }

          console.log('Debug - Subscription:', subscriptionData)
          setSubscription(subscriptionData)
          
          // Load payment methods if we have a customer ID
          if (profileData.stripe_customer_id) {
            const paymentMethodsResponse = await fetch('/api/stripe/payment-methods', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ customerId: profileData.stripe_customer_id })
            })
            
            if (!paymentMethodsResponse.ok) {
              const errorData = await paymentMethodsResponse.json()
              console.error('Payment methods error:', errorData)
              return
            }

            const { paymentMethods, error: paymentMethodsError } = await paymentMethodsResponse.json()
            
            if (paymentMethodsError) {
              console.error('Payment methods error:', paymentMethodsError)
              return
            }

            console.log('Debug - Payment Methods:', paymentMethods)
            setPaymentMethods(paymentMethods)

            // Load invoices
            const invoicesResponse = await fetch('/api/stripe/invoices', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ customerId: profileData.stripe_customer_id })
            })

            if (!invoicesResponse.ok) {
              const errorData = await invoicesResponse.json()
              console.error('Invoices error:', errorData)
              return
            }

            const { invoices, error: invoicesError } = await invoicesResponse.json()
            
            if (invoicesError) {
              console.error('Invoices error:', invoicesError)
              return
            }

            setInvoices(invoices)
          }
        }
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

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return 0
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatPrice = (amount?: number, currency?: string) => {
    if (!amount || !currency) return ''
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0
    }).format(amount / 100)
  }

  const handleAction = async (action: any, data: FormData) => {
    setActionLoading(true)
    try {
      const result = await action(data)
      if (result.error) {
        throw new Error(result.error)
      }
      router.refresh()
    } catch (error) {
      console.error('Action error:', error)
      // TODO: Show error toast
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddPaymentMethod = async () => {
    try {
      setActionLoading(true)
      setError(null)
      
      if (!profile?.stripe_customer_id) {
        throw new Error('No customer ID found')
      }

      // Get SetupIntent from our API
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId: profile.stripe_customer_id 
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create setup intent')
      }

      const { clientSecret, error } = await response.json()
      
      if (error) {
        throw new Error(error)
      }

      setSetupIntent({ clientSecret })
      setShowCardInput(true)
    } catch (error: any) {
      console.error('Setup error:', error)
      setError(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePaymentMethodAdded = async () => {
    // Refresh payment methods
    const { paymentMethods: updatedMethods } = await (
      await fetch('/api/stripe/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId: profile.stripe_customer_id 
        })
      })
    ).json()
    
    setPaymentMethods(updatedMethods)
    setShowCardInput(false)
    setSetupIntent(null)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="pl-4 pt-3 bg-[#0f1729] text-white pb-4">
        <h1 className="text-4xl font-mono mb-4">
          <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
            Billing & Subscription
          </span>
        </h1>
        <div className="border-[#ff9920] border-b-2 -mt-8 mb-4 w-[98.55%] h-4"></div>

        <AccountNav />

        <div className="pr-6 pl-8 pb-6 pt-4 mr-4 bg-[#131d43] text-white min-h-[500px] shadow-sm shadow-green-400 rounded-md border-blue-800 border flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-sm text-gray-400">Loading subscription details...</span>
          </div>
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
      
      <AccountNav />
      
      <div className="pr-6 pl-8 pb-4 pt-4 bg-[#131d43] text-white shadow-sm shadow-green-400 rounded-md border-blue-800 border">
        {/* Subscription Details */}
        <Card className="border-0 mb-6">
          <div className="p-4 bg-[#111c44] rounded-lg border border-blue-800">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Current Plan</h3>
                {subscription ? (
                  <>
                    <p className="text-gray-400 text-sm">{product?.name}</p>
                    <p className="text-gray-400 text-sm">
                      Status: {' '}
                      {subscription.status === 'trialing' ? (
                        <span className="text-blue-400">
                          Free Trial Period Ends in {getDaysRemaining(subscription.trial_end)} Days
                        </span>
                      ) : (
                        <span className={`capitalize ${subscription.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {subscription.status}
                          {subscription.cancel_at_period_end ? ' (Cancels at period end)' : ''}
                        </span>
                      )}
                    </p>
                    {price && (
                      <p className="text-gray-400 text-sm">
                        {formatPrice(price.unit_amount, price.currency)}/{price.interval}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-400 text-sm">No active subscription</p>
                )}
              </div>

              <div className="flex gap-3">
                {subscription?.status === 'active' && (
                  subscription.cancel_at_period_end ? (
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData()
                      formData.append('subscriptionId', subscription.id)
                      handleAction(resumeSubscription, formData)
                    }}>
                      <Button 
                        type="submit"
                        disabled={actionLoading}
                        className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                      >
                        Resume Subscription
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData()
                      formData.append('subscriptionId', subscription.id)
                      handleAction(cancelSubscription, formData)
                    }}>
                      <Button 
                        type="submit"
                        disabled={actionLoading}
                        variant="destructive"
                        className="bg-red-900 hover:bg-red-800"
                      >
                        Cancel Subscription
                      </Button>
                    </form>
                  )
                )}
                
                {!subscription && (
                  <Button 
                    asChild
                    className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                  >
                    <a href="/pricing">View Plans</a>
                  </Button>
                )}
              </div>
            </div>

            {product?.features && product.features.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-[#008ffb] mb-2">Plan Features:</p>
                <ul className="list-disc list-inside space-y-1">
                  {product.features.map((feature: string, index: number) => (
                    <li key={index} className="text-sm text-gray-400/90">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        {/* Payment Methods */}
        {subscription && (
          <Card className="border-0 mb-6">
            <div className="p-4 bg-[#111c44] rounded-lg border border-blue-800">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Methods
                  </h3>
                  <p className="text-gray-400 text-sm">Manage your payment methods</p>
                </div>
                
                {!showCardInput && (
                  <Button 
                    onClick={handleAddPaymentMethod}
                    disabled={actionLoading}
                    className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                  >
                    Add Payment Method
                  </Button>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {showCardInput && setupIntent && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret: setupIntent.clientSecret,
                    appearance: {
                      theme: 'night',
                      variables: {
                        colorPrimary: '#1B2559',
                        colorBackground: '#0f1729',
                        colorText: '#ffffff',
                        colorDanger: '#dc2626',
                      },
                    },
                  }}
                >
                  <AddPaymentMethodForm
                    onSuccess={handlePaymentMethodAdded}
                    onCancel={() => {
                      setShowCardInput(false)
                      setSetupIntent(null)
                      setError(null)
                    }}
                  />
                </Elements>
              )}

              <div className="space-y-3">
                {paymentMethods.map((method: any) => (
                  <div key={method.id} className="flex justify-between items-center p-3 bg-[#0f1729] rounded border border-blue-900">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-white">
                          {method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)} •••• {method.card.last4}
                        </p>
                        <p className="text-xs text-gray-400">
                          Expires {method.card.exp_month}/{method.card.exp_year}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {method.id !== subscription.default_payment_method && (
                        <form onSubmit={(e) => {
                          e.preventDefault()
                          const formData = new FormData()
                          formData.append('paymentMethodId', method.id)
                          formData.append('customerId', subscription.stripe_customer_id)
                          handleAction(updatePaymentMethod, formData)
                        }}>
                          <Button
                            type="submit"
                            disabled={actionLoading}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Make Default
                          </Button>
                        </form>
                      )}

                      <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData()
                        formData.append('paymentMethodId', method.id)
                        handleAction(removePaymentMethod, formData)
                      }}>
                        <Button
                          type="submit"
                          disabled={actionLoading || method.id === subscription.default_payment_method}
                          variant="destructive"
                          size="sm"
                          className="text-xs bg-red-900 hover:bg-red-800"
                        >
                          Remove
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}

                {paymentMethods.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-sm">No payment methods added yet</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Billing History */}
        {subscription && (
          <Card className="border-0">
            <div className="p-4 bg-[#111c44] rounded-lg border border-blue-800">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Billing History
                  </h3>
                  <p className="text-gray-400 text-sm">View your past invoices</p>
                </div>
              </div>

              <div className="space-y-3">
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <div 
                      key={invoice.id} 
                      className="flex justify-between items-center p-3 bg-[#0f1729] rounded border border-blue-900"
                    >
                      <div>
                        <p className="text-sm text-white">
                          {new Date(invoice.created * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatPrice(invoice.amount_paid, invoice.currency)}
                          {invoice.subscription && ` - ${invoice.lines.data[0]?.description}`}
                        </p>
                      </div>
                      
                      <a 
                        href={invoice.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                      >
                        <Download className="h-4 w-4" />
                        View Invoice
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-sm">No billing history available</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
} 
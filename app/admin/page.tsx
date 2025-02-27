'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ResendVerification } from '@/components/admin/resend-verification'
import { createClient } from '@/utils/supabase/client'
import dynamic from 'next/dynamic'

const SyncStripeProducts = dynamic(
  () => import('@/components/admin/sync-stripe-products'),
  { ssr: false }
)

const SyncStripeSubscriptions = dynamic(
  () => import('@/components/admin/sync-stripe-subscriptions'),
  { ssr: false }
)

const StripeTestButton = dynamic(
  () => import('@/components/admin/stripe-test-button'),
  { ssr: false }
)

const UrlConfigButton = dynamic(
  () => import('@/components/admin/url-config-button'),
  { ssr: false }
)

// Client component for test checkout
function TestCheckoutSection() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    try {
      setLoading(true)
      setError(null)

      // This is a test price ID - replace with your actual price ID
      const priceId = 'price_H5ggYwtDq4fbrJ'
      // This is a test user ID - replace with an actual user ID from your database
      const userId = 'test-user-123'

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900">
          Test Stripe Checkout
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Use this section to test the Stripe checkout flow
        </p>
      </div>
      {error && (
        <div className="mt-4 bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Test Checkout Flow'}
      </button>
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/auth/signin')
      } else {
        setIsLoading(false)
      }
    }
    
    checkUser()
  }, [router, supabase.auth])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1729] p-8 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1729] p-8">
      <h1 className="text-3xl font-mono text-white mb-8">
        <span className="text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          Admin Tools
        </span>
      </h1>
      
      <div className="grid gap-8">
        <ResendVerification />
        <SyncStripeProducts />
        <SyncStripeSubscriptions />
        <StripeTestButton />
        <UrlConfigButton />
        {/* Add more admin tools here */}
      </div>

      {/* Test Checkout Section at the bottom */}
      <div className="mt-8">
        <TestCheckoutSection />
      </div>
    </div>
  )
}
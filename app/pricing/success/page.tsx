'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<'loading' | 'preparing' | 'redirecting'>('loading')
  const [userExists, setUserExists] = useState(false)

  useEffect(() => {
    async function getSessionData() {
      const sessionId = searchParams.get('session_id')
      if (!sessionId) {
        setError('No session ID found')
        setIsLoading(false)
        return
      }

      try {
        setStage('loading')
        // Use the new session endpoint
        const response = await fetch(`/api/stripe/session-new?sessionId=${sessionId}`)
        const data = await response.json()
        
        console.log('Session data:', data)
        
        if (!response.ok) throw new Error(data.message || 'Failed to get session')
        
        const email = data.customer_email
        const name = data.customer_details?.name
        const stripeCustomerId = data.customer
        const subscriptionId = data.subscription?.id

        if (!email) {
          throw new Error('No customer email found in session data')
        }

        console.log('Customer data:', {
          email,
          name,
          stripeCustomerId,
          subscriptionId
        })

        // Check if email exists using our safe endpoint
        const checkResponse = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`)
        const { exists } = await checkResponse.json()
        setUserExists(exists)

        console.log('User exists check:', { email, exists })

        // Show preparing message for 1 second
        setStage('preparing')
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Show redirecting message for 1 second
        setStage('redirecting')
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Conditionally redirect based on whether the user exists
        if (exists) {
          // If user exists, redirect to sign in
          router.push(`/auth/signin?email=${encodeURIComponent(email)}`)
        } else {
          // If new user, redirect to sign up
          let signupUrl = `/auth/signup?email=${encodeURIComponent(email)}`
          
          // Add name if available
          if (name) {
            signupUrl += `&name=${encodeURIComponent(name)}`
          }
          
          // Add Stripe customer ID if available
          if (stripeCustomerId) {
            signupUrl += `&stripe_customer_id=${encodeURIComponent(stripeCustomerId)}`
          }
          
          router.push(signupUrl)
        }
        
      } catch (err) {
        console.error('Error fetching session:', err)
        setError(err instanceof Error ? err.message : 'Failed to load session data')
        setIsLoading(false)
      }
    }

    getSessionData()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <div className="mt-6">
            <Link href="/">
              <Button className="w-full">Return to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg text-center">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          {stage === 'loading' ? (
            <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
          ) : (
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Payment Successful!
        </h2>
        <div className="mt-2 space-y-2">
          {stage === 'loading' && (
            <p className="text-sm text-gray-600">
              Verifying your subscription details...
            </p>
          )}
          {stage === 'preparing' && (
            <p className="text-sm text-gray-600">
              Great! We're preparing your account...
            </p>
          )}
          {stage === 'redirecting' && (
            <p className="text-sm text-gray-600">
              {userExists 
                ? "Taking you to sign in..." 
                : "Taking you to create your account..."}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Please don't close this window
          </p>
        </div>
        {stage === 'loading' && (
          <div className="mt-4">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
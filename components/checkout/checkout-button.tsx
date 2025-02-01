'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface CheckoutButtonProps {
  priceId: string
}

export function CheckoutButton({ priceId }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCheckout = async () => {
    try {
      setLoading(true)
      console.log('Starting checkout with priceId:', priceId)

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })
      
      const data = await response.json()
      console.log('Checkout response:', data)

      if (!response.ok) {
        throw new Error(data.message || 'Error creating checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        console.log('Redirecting to:', data.url)
        router.push(data.url)
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full bg-green-700 text-whie hover:bg-green-600 border-blue-500 border"
    >
      <span className="text-shadow-sm text-shadow-blur-1 text-shadow-black">
        {loading ? 'Loading...' : 'Subscribe'}
      </span>    
    </Button>
  )
} 
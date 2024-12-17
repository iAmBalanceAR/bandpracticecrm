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

      const response = await fetch(`/api/checkout?priceId=${priceId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error creating checkout session')
      }

      // Redirect to Stripe Checkout
      router.push(data.url)
    } catch (error) {
      console.error('Error:', error)
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
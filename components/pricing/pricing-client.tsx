'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckoutButton } from '@/components/checkout/checkout-button'
import { Check } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
//import type { Database } from '@/types/supabase'

interface PricingClientProps {
  products: Array<any>
  user: any | null
  userSubscription?: {
    status: string
    stripe_customer_id: string
  } | null
}

export function PricingClient({ products, user, userSubscription }: PricingClientProps) {
  const [isAnnual, setIsAnnual] = useState(false)

  console.log('PricingClient user:', user)
  console.log('PricingClient userSubscription:', userSubscription)

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/billing/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          customerStripeId: userSubscription?.stripe_customer_id 
        }),
      })
      
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error managing subscription:', error)
    }
  }

  return (
    <>
    <div className="pl-4 pr-4 pt-3 pb-6 bg-[#0f1729] text-white">
      <h1 className="text-4xl font-mono mb-3">
        <span className="w-[100%] text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          Subscription Plans
        </span>
      </h1>
      <div className="border-[#008ffb] border-b-2 -mt-7 w-[100%] h-4 mb-4"></div>
      
      <div className="pr-6 pl-8 pb-6 pt-4 bg-[#131d43] text-white min-h-[500px] shadow-sm shadow-green-400 rounded-md border-blue-800 border">
        <p className="align-center text-center mb-4">
          <span className="text-lg text-white text-shadow-sm text-shadow-blur-4 text-shadow-black">
            Enjoy the first 7 days of your new plan for FREE.<br />
          </span>
          Cancel anytime.
        </p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Label className="text-lg">Monthly</Label>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            className="data-[state=checked]:bg-green-500"
          />
          <div className="flex flex-row items-start">
            <Label className="flex-row text-lg">Annual</Label>
            <span className="pl-2 mt-1 flex-row text-sm text-green-400"> (Save 25%) </span>
          </div>
        </div>

        <div className="items-center max-w-[31%] min-w-[299px] mx-auto">
          {products?.map((product) => {
            // Find the appropriate price based on interval
            const prices = product.prices || []
            const price = prices.find((p: any) => 
              p.interval === (isAnnual ? 'year' : 'month')
            ) || prices[0]

            const priceString = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: price.currency,
              minimumFractionDigits: 0,
            }).format((price.unit_amount || 0) / 100)

            // Calculate monthly equivalent for annual plans
            const monthlyEquivalent = isAnnual 
              ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: price.currency,
                  minimumFractionDigits: 0,
                }).format((price.unit_amount || 0) / 1200)
              : null

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-[#0f1729] rounded-lg border border-blue-700 shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="space-y-2">
                    <h3 className="text-3xl pt-0 mt-0 font-mono text-white text-shadow-blur-4 text-shadow-blue-900 text-shadow-sm">
                      {product.name}
                    </h3>
                    <div className="mb-4">
                      <div className="mb-3">
                        <span className="text-shadow-blur-4 text-shadow-blue-900 text-shadow-sm text-3xl font-mono text-white">
                          {priceString}
                        </span>
                        <span className="text-gray-400">
                          /{isAnnual ? 'year' : 'month'}
                        </span>
                        {isAnnual && (
                          <div className="text-sm text-gray-400 mt-1">
                            {monthlyEquivalent}/mo when paid annually
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-400 mb-3 text-sm text-shadow-sm text-shadow-blur-4 text-shadow-black">
                    {product.description}
                  </p>
                  {/* Marketing Features */}
                  {product.metadata?.['feature-list'] && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-white pt-0 mt-0 mb-3">
                        Features
                      </h4>
                      <ul className="space-y-4">
                        {product.metadata['feature-list']
                          .split(', ')
                          .map((feature: string, i: number) => (
                            <li key={i} className="flex items-start text-gray-300">
                              <Check className="h-5 w-5 mr-3 text-[#00e396] mt-1 flex-shrink-0" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {/* Additional Features */}
                  {product.features && product.features.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-white mb-3">
                        Additional Features
                      </h4>
                      <ul className="space-y-4">
                        {product.features.map((feature: string, i: number) => (
                          <li key={i} className="flex items-start text-gray-300">
                            <Check className="h-5 w-5 mr-3 text-[#00e396] mt-1 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {!user ? (
                    <Button
                      asChild
                      className="w-full bg-green-700 hover:bg-green-600 text-white text-lg"
                    >
                      <Link href="/auth/signup">
                        Sign up to subscribe
                      </Link>
                    </Button>
                  ) : userSubscription?.status === 'active' ? (
                    <Button
                      onClick={handleManageSubscription}
                      className="w-full bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                    >
                      Manage Subscription
                    </Button>
                  ) : (
                    <CheckoutButton priceId={price.id?.trim()} />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
    </>
  )
} 
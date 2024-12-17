'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckoutButton } from '@/components/checkout/checkout-button'
import { Check } from 'lucide-react'
import type { Database } from '@/types/supabase'

interface PricingClientProps {
  products: Array<any>
  user: any | null
}

export function PricingClient({ products, user }: PricingClientProps) {
  return (
    <>
    
    <div className="pl-4 pt-3 bg-[#0f1729] text-white min-h-screen">
      <h1 className="text-4xl font-mono mb-3">
        <span className="w-[100%] text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          Subscription Plans
        </span>
      </h1>
      <div className="border-[#008ffb] border-b-2 -mt-7 mb-8 w-[100%] h-4"></div>
      
      <div className="pr-6 pl-8 pb-6 pt-4 bg-[#131d43] text-white min-h-[500px] shadow-sm shadow-green-400 rounded-md border-blue-800 border">
      <p><span className="text-xl text-white  text-shadow-sm text-shadow-blur-4 text-shadow-black">Choose the plan that works for you</span></p>
        <div className="grid gap-6 md:grid-cols-3">
          {products?.map((product, index) => {
            const price = product.prices[0]
            const priceString = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: price.currency,
              minimumFractionDigits: 0,
            }).format((price.unit_amount || 0) / 100)

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-[#0f1729] rounded-lg border border-[#1E293B] shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {product.name}
                  </h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      {priceString}
                    </span>
                    {price.type === 'recurring' && (
                      <span className="text-gray-400">
                        /{price.interval}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-4 mb-8">
                    {product.description?.split('\n').map((feature: string, i: number) => (
                      <li key={i} className="flex items-center text-gray-300">
                        <Check className="h-5 w-5 mr-3 text-[#00e396]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {user ? (
                    <CheckoutButton priceId={price.id} />
                  ) : (
                    <Button
                      asChild
                      className="w-full bg-green-700 hover:bg-green-600 text-white"
                    >
                      <Link href="/auth/signin">
                        Sign in to subscribe
                      </Link>
                    </Button>
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
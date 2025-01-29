'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckoutButton } from '@/components/checkout/checkout-button'
import { Check } from 'lucide-react'
//import type { Database } from '@/types/supabase'

interface PricingClientProps {
  products: Array<any>
  user: any | null
}

export function PricingClient({ products, user }: PricingClientProps) {
  return (
    <>
    <div className="pl-4 pr-4 pt-3 pb-6 bg-[#0f1729] text-white">
      <h1 className="text-4xl font-mono mb-3">
        <span className="w-[100%] text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          Subscription Plans
        </span>
      </h1>
      <div className="border-[#008ffb] border-b-2 -mt-7 w-[100%] h-4 mb-4"></div>
      
      <div className=" pr-6 pl-8 pb-6 pt-4 bg-[#131d43] text-white min-h-[500px] shadow-sm shadow-green-400 rounded-md border-blue-800 border">
        <p className="align-center text-center mb-8"><span className="text-lg text-white text-shadow-sm text-shadow-blur-4 text-shadow-black">
          Enjoy the first 7 days of your new plan for FREE.<br />
            </span>
            Cancel anytime.
            </p>
        <div className=" items-center max-w-[31%] min-w-[299px] mx-auto">
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
                className="bg-[#0f1729] rounded-lg border border-blue-700 shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="space-y-2">
                    <h3 className="text-3xl pt-0 mt-0 font-mono text-white  text-shadow-blur-4 text-shadow-blue-900 text-shadow-sm">
                      {product.name}
                    </h3>
                    <div className="mb-4">
                      <div className="mb-3">
                          <span className=" text-shadow-blur-4 text-shadow-blue-900 text-shadow-sm text-3xl font-mono text-white ">
                            {priceString}
                          </span>
                          {price.type === 'recurring' && (
                            <span className="text-gray-400">
                              /{price.interval}
                            </span>
                          )}
                       </div>
                    </div>
                  </div>
                  <p className="text-gray-400 mb-3 text-sm text-shadow-sm text-shadow-blur-4 text-shadow-black">{product.description}</p>
                  {/* Marketing Features */}
                  {product.marketing_features && product.marketing_features.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-white pt-0 mt-0 mb-3  text-shadow-blur-4 text-shadow-blue-900 text-shadow-smm">Features</h4>
                      <ul className="space-y-4">
                        {product.marketing_features.map((feature: string, i: number) => (
                          <li key={i} className="flex items-start text-gray-300">
                            <Check className="h-5 w-5 mr-3 text-[#00e396] mt-1 flex-shrink-0" />
                            <span className=" text-shadow-blur-4 text-shadow-black text-shadow-sm text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Additional Features */}
                  {product.features && product.features.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-white mb-3">Additional Features</h4>
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
                  {user ? (
                    <CheckoutButton priceId={price.id?.trim()} />
                  ) : (
                    <Button
                      asChild
                      className="w-full bg-green-700 hover:bg-green-600 text-white text-lg"
                    >
                      <Link href="/auth/signup">
                        Sign up to subscribe
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
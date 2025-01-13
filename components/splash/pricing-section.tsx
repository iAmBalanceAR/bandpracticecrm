"use client"

import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Check } from 'lucide-react'
import Link from 'next/link'

const plans = [
  // {
  //   name: "7 Day Free Trial",
  //   price: "Free",
  //   interval: "",
  //   features: [
  //     "Full Access, No Restrictions",
  //     "Standard Monthly Rate After Trial",
  //     "Cancel Anytime"
  //   ]
  // },
  
  {
    name: "Tour Manager",
    price: "$20",
    interval: " monthly",
    features: [
      "Advanced Tour Management",
      "Unlimited Tours",
      "Venue Database Search & Save",
      "Lead Management",
      "Data Analytics",
      "Stage Plot Generator"
    ]
  }
]


export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-[url('https://images.unsplash.com/photo-1487954152950-e0584673b7f3')] bg-cover bg-left-bottom h-screen w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4  items-center justify-center h-full relative z-10 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-8xl font-mono mb-4 text-center text-shadow-md text-shadow-black text-white">Tour Smart</h1>
          <span className="text-xl text-white text-shadow-sm text-shadow-blur-4 text-shadow-black">Professional tour management at an indie band price.</span>
        </motion.div>
<div className="align-center justify-center items-center w-full">
        <div className="w-[26%] min-w-[240px] mx-auto relative">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-[#030817] p-8 rounded-lg border border-blue-700"
            >
              <h3 className="text-2xl font-bold text-white mb-2 text-shadow-sm text-shadow-blur-4 text-shadow-black">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white text-shadow-sm text-shadow-blur-4 text-shadow-black">{plan.price}</span>
                <span className="text-gray-400 text-shadow-sm text-shadow-blur-4 text-shadow-black">/{plan.interval}</span>
              </div>
              <ul className="mb-12 space-y-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-gray-300">
                    <Check className="w-5 h-5 mr-2 text-green-500" />
                    <span className="text-shadow-sm text-shadow-blur-4 text-shadow-black">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/sign-up">
                <Button className="w-full bg-green-700 text-white hover:bg-green-600 border-blue-500 border">
                  <span className="text-white text-shadow-sm text-shadow-blur-1 text-shadow-black">Start 7-Day Trial</span>
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      <span className="mt-4 text-xl text-white text-shadow-sm text-shadow-blur-4 text-shadow-black">Try everything free for 7 days.</span>
      </div>
    </section>
  )
} 
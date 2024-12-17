"use client"

import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Check } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: "Try Band Practice",
    price: "Free",
    interval: "",
    features: [
      "Basic Tour Management",
      "1 Tour",
      "Sample Venue Database",
      "Basic Calendar Management",
      "Document Storage (100MB)"
    ]
  },
  
  {
    name: "Standard",
    price: "$14.99",
    interval: " monthly",
    features: [
      "Advanced Tour Management",
      "Unlimite Tours",
      "Enriched Venue Database",
      "Routing Resources",
      "Analytics",
      "5Gb Image/Doc Storage",
      "Timely Support"
    ]
  },
  {
    name: "Professional",
    price: "$24.99",
    interval: " monthly",
    features: [
      "Advanced Tour Management",
      "Unlimited Tours",
      "Full Venue Database",
      "AI Route Suggestions",
      "Advanced Analytics",
      "Unlimited Storage",
      "Priority Support"
    ]
  
}
]


export default function PricingSection() {
  return (
    <section className="py-20 h-screen w-full bg-[url('https://plus.unsplash.com/premium_photo-1663046050988-1b873a56dced?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')]">
      <div className="max-w-7xl mx-auto px-4  items-center justify-center h-full relative z-10 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
         <h2 className="text-4xl font-mono text-white mb-4 ">
        <span className="text-shadow  text-shadow-sm text-shadow-blur-4 text-shadow-black">
            Simple Pricing        
        </span>
        </h2>
          <span className="text-xl text-white  text-shadow-sm text-shadow-blur-4 text-shadow-black">Choose the plan that works for you</span>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto relative">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-[#1B2559] p-8 rounded-lg border border-blue-800"
            >
              <h3 className="text-2xl font-bold text-white mb-2 text-shadow-sm text-shadow-blur-4 text-shadow-black">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white text-shadow-sm text-shadow-blur-4 text-shadow-black">{plan.price}</span>
                <span className="text-gray-400 text-shadow-sm text-shadow-blur-4 text-shadow-black">/{plan.interval}</span>
              </div>
              <ul className="mb-8 space-y-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-gray-300">
                    <Check className="w-5 h-5 mr-2 text-green-500" />
                    <span className="text-shadow-sm text-shadow-blur-4 text-shadow-black">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/sign-up">
                <Button className="w-[20%] bottom-4 absolute bg-green-700 ml-8 text-whie hover:bg-green-600 border-blue-500 border">
                <span className="text-shadow-sm text-shadow-blur-1 text-shadow-black">Get Started</span>
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 
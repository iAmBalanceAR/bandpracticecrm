"use client"

import { motion } from 'framer-motion'
import { Map, Calendar, BarChart3, MapPin } from 'lucide-react'

const features = [
  {
    icon: <MapPin className="w-12 h-12" />,
    title: "Smart Tour Routing",
    description: "AI-powered route optimization and venue suggestions based on your tour schedule."
  },
  {
    icon: <Map className="w-12 h-12" />,
    title: "Venue Database",
    description: "Comprehensive database of venues with detailed information and booking contacts."
  },
  {
    icon: <Calendar className="w-12 h-12" />,
    title: "Gig Management",
    description: "Complete calendar and event management system for your tours and shows."
  },
  {
    icon: <BarChart3 className="w-12 h-12" />,
    title: "Financial Tracking",
    description: "Track expenses, income, and profitability for every tour and show."
  }
]

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-[url('https://images.unsplash.com/photo-1692592689531-f793e8ecb44e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] relative h-screen w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 items-center justify-center h-full relative z-10 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-8xl font-mono mb-4 text-center text-shadow-md text-shadow-black text-white">Features</h1>
          <p className="text-xl text-white"><span className="text-shadow-black text-shadow-sm">Everything you need to manage your tours</span></p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-[#1B2559] p-6 rounded-lg text-center"
            >
              <div className="text-[#008ffb] mb-4 flex justify-center">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">
                <span className="text-shadow-black text-shadow-blur-2 text-shadow-sm">
                  {feature.title}
                </span>
              </h3>
              <p className="text-white"><span className="text-shadow-black text-shadow-blur-2 text-shadow-sm">{feature.description}</span></p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 
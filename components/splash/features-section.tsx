"use client"

import { motion } from 'framer-motion'
import { Map, Calendar, BarChart3, MapPin } from 'lucide-react'

const features = [
  {
    icon: <MapPin className="w-12 h-12" />,
    title: "Multi-Tour Dashboard",
    description: "Keep every tour organized in one place - no more scattered spreadsheets or missed details."
  },
  {
    icon: <Map className="w-12 h-12" />,
    title: "Venue Intelligence",
    description: "Instant access to 50,000+ venue contacts, capacities, and tech specs - book smarter, faster."
  },
  {
    icon: <Calendar className="w-12 h-12" />,
    title: "Smart Gig Management",
    description: "Track every detail from load-in to payout. Never miss a soundcheck or settlement again."
  },
  {
    icon: <BarChart3 className="w-12 h-12" />,
    title: "Tour Analytics",
    description: "Real-time insights into your tour's performance. Make data-driven decisions that boost your bottom line."
  }
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-[url('https://images.unsplash.com/photo-1453090927415-5f45085b65c0')] bg-cover bg-right-bottom relative h-screen w-full overflow-hidden">
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
              className="bg-[#030817] p-6 rounded-lg text-center border-blue-700 border"
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
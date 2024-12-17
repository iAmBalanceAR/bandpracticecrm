"use client"

import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import Link from 'next/link'

export default function CTASection() {
  return (
    <section className="py-20 h-screen w-full bg-bottom bg-[url('https://images.unsplash.com/photo-1729842624908-639b1542fb2c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')]">
      <div className="max-w-7xl mx-auto px-4  items-center justify-center h-full relative z-10 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-mono text-white mb-6">
          <span className="text-shadow-black text-shadow-blur-2 text-shadow-sm"> Ready to Simplify Your Tour Management?
          </span>
          </h2>
          <p className="text-xl text-white mb-8">
          <span className="text-shadow-black text-shadow-blur-2 text-shadow-sm">Join thousands of bands and artists who are already using Band Practice CRM
          </span>
          </p>
          <div className="space-x-4">
            <Link href="/sign-up">
              <Button size="lg"  className="bg-blue-700 text-white hover:bg-blue-600 hover:border-blue-600 text-sm px-8 border border-black">
                Get Started Free
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline"className="text-whiteb bg-green-700 border-black hover:border-green-600 hover:text-white hover:bg-green-600  text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 
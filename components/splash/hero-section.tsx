"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "../ui/button"
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  bgImage: string;
  ctaText: string;
}

const heroSlides: HeroSlide[] = [
  {
    id: 1,
    title: "Band Practice CRM",
    subtitle: "Tour Management Simplified",
    bgImage: "https://plus.unsplash.com/premium_photo-1661299366011-bb9f86212bdb?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ctaText: "Start Planning"
  },
  {
    id: 2,
    title: "AI Powered Tour Routing",
    subtitle: "AI filtered Venues Along Your Route",
    bgImage: "https://images.unsplash.com/photo-1533559662493-65ffecb14f7d?q=80&w=2095&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ctaText: "Learn More"
  },
  {
    id: 3,
    title: "50k+ Venue Database",
    subtitle: "Current National Venue Data",
    bgImage: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14",
    ctaText: "Explore Venues"
  }
]

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          
          exit={{ opacity:  0}}
          transition={{ duration: 1 }}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${heroSlides[currentSlide].bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>

        <motion.div
          key={`content-${currentSlide}`}
          initial={{ opacity: 0, y: 55 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -55 }}
          className="relative z-10 flex flex-col items-center justify-center h-full text-white"
        >
          <h1 className="text-6xl md:text-8xl font-mono mb-4 text-center text-shadow-md text-shadow-blur-4 text-shadow-black">
            {heroSlides[currentSlide].title}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-center text-shadow-sm text-shadow-blur-4 text-shadow-black">
            {heroSlides[currentSlide].subtitle}
          </p>
          <div className="space-x-4">
            <Button 
              size="lg"
              className="bg-blue-700 text-white hover:bg-blue-600 hover:border-blue-600 text-sm px-8 border border-black"
              onClick={() => scrollToSection('features')}
            >
              <span className='text-shadow-sm text-shadow-blur-4 text-shadow-black text-lg'>Learn More</span>
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="text-whiteb bg-green-700 border-black hover:border-green-600 hover:text-white hover:bg-green-600  text-lg px-8"
              onClick={() => scrollToSection('pricing')}
            >
              <span className='text-shadow-sm text-shadow-blur-4 text-shadow-black'>View Pricing</span>
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      <div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer"
        onClick={() => scrollToSection('features')}
      >
        <ChevronDown className="w-8 h-8 text-white" />
      </div>
    </div>
  )
} 
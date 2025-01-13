"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "../ui/button"
import { ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
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
    subtitle: "Stop Managing Tours. Start Making Music.",
    bgImage: "https://plus.unsplash.com/premium_photo-1661299366011-bb9f86212bdb",
    ctaText: "Find Out More"
  },
  {
    id: 4,
    title: "Know Your Numbers",
    subtitle: "Turn Tour Data into Better Decisions",
    bgImage: "https://images.unsplash.com/photo-1495651779359-881fde1808a6",
    ctaText: "Learn More"
  },
  {
    id: 3,
    title: "50,000+ Venues",
    subtitle: "Book Better Shows, Fill Your Calendar",
    bgImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
    ctaText: "Get Started"
  },
  {
    id: 2,
    title: "Multiple Tours? No Problem",
    subtitle: "One Dashboard for All Your Shows",
    bgImage: "https://images.unsplash.com/photo-1533559662493-65ffecb14f7d",
    ctaText: "Learn More"
  },
  {
    id: 5,
    title: "Built for Musicians",
    subtitle: "Stage Plots to Settlement Sheets - We've Got You Covered",
    bgImage: "https://plus.unsplash.com/premium_photo-1682125853703-896a05629709",
    ctaText: "Get Started"
  }
]

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [hasAnimatedLogo, setHasAnimatedLogo] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > window.innerHeight / 2)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' as const
    })
  }

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentSlide === 0) {
        setHasAnimatedLogo(true)
        setTimeout(() => {
          setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
        }, 1200)
      } else {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
      }
    }, 8000)
    return () => clearInterval(timer)
  }, [currentSlide])

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
      {/* Fixed Logo */}
      <AnimatePresence>
        {hasAnimatedLogo && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="fixed z-50"
            style={{ 
              transformOrigin: 'top right',
              top: '12px',
              right: '12px'
            }}
          >
            <Image 
              src="/images/logo-full.png" 
              alt="Band Practice CRM"
              width={202}
              height={37}
              priority
              className="scale-100"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode='wait'>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
          {currentSlide === 0 ? (
            <motion.div
              initial={{ scale: 1 }}
              exit={{ 
                opacity: 0
              }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            >
              <Image 
                src="/images/logo-full.png" 
                alt="Band Practice CRM"
                width={863}
                height={160}
                className="mb-4"
                priority
              />
            </motion.div>
          ) : (
            <h1 className="text-6xl md:text-8xl font-mono mb-4 text-center text-shadow-md text-shadow-blur-4 text-shadow-black">
              {heroSlides[currentSlide].title}
            </h1>
          )}
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

      <AnimatePresence>
        {showBackToTop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 cursor-pointer z-50"
            onClick={scrollToTop}
          >
            <div className="bg-blue-700 hover:bg-blue-600 rounded-full p-2 border border-black">
              <ChevronUp className="w-8 h-8 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 
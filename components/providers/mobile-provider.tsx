'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface MobileContextType {
  isMobile: boolean
  isPortrait: boolean
  isLandscape: boolean
  isTouchDevice: boolean
  safeAreaInsets: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

const MobileContext = createContext<MobileContextType | undefined>(undefined)

export function useMobile() {
  const context = useContext(MobileContext)
  if (context === undefined) {
    throw new Error('useMobile must be used within a MobileProvider')
  }
  return context
}

export default function MobileProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, setState] = useState<MobileContextType>({
    isMobile: false,
    isPortrait: true,
    isLandscape: false,
    isTouchDevice: false,
    safeAreaInsets: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  })

  useEffect(() => {
    const updateDeviceState = () => {
      const isMobile = window.matchMedia('(max-width: 767px)').matches
      const isPortrait = window.matchMedia('(orientation: portrait)').matches
      const isLandscape = !isPortrait
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      setState(prev => ({
        ...prev,
        isMobile,
        isPortrait,
        isLandscape,
        isTouchDevice,
      }))
    }

    // Initial check
    updateDeviceState()

    // Add event listeners
    const mediaQueries = [
      window.matchMedia('(max-width: 767px)'),
      window.matchMedia('(orientation: portrait)'),
    ]

    const handleChange = () => updateDeviceState()

    mediaQueries.forEach(query => {
      query.addEventListener('change', handleChange)
    })

    // Update safe area insets
    const updateSafeAreaInsets = () => {
      const style = getComputedStyle(document.documentElement)
      setState(prev => ({
        ...prev,
        safeAreaInsets: {
          top: parseInt(style.getPropertyValue('--sat') || '0', 10),
          right: parseInt(style.getPropertyValue('--sar') || '0', 10),
          bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
          left: parseInt(style.getPropertyValue('--sal') || '0', 10),
        },
      }))
    }

    // Add CSS variables for safe area insets
    const root = document.documentElement
    root.style.setProperty('--sat', 'env(safe-area-inset-top)')
    root.style.setProperty('--sar', 'env(safe-area-inset-right)')
    root.style.setProperty('--sab', 'env(safe-area-inset-bottom)')
    root.style.setProperty('--sal', 'env(safe-area-inset-left)')

    updateSafeAreaInsets()
    window.addEventListener('resize', updateSafeAreaInsets)

    // Cleanup
    return () => {
      mediaQueries.forEach(query => {
        query.removeEventListener('change', handleChange)
      })
      window.removeEventListener('resize', updateSafeAreaInsets)
    }
  }, [])

  return (
    <MobileContext.Provider value={state}>
      {children}
    </MobileContext.Provider>
  )
} 
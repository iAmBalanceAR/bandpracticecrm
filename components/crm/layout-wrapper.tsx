"use client"

import * as React from "react"
import SideMenu from "@/components/crm/side-menu"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { useSupabase } from "@/components/providers/supabase-client-provider"
import { Footer } from "@/components/ui/footer"

export default function LayoutWrapper({ 
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize with true, but we'll update it in useEffect for mobile devices
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const sidebarOpenRef = React.useRef(sidebarOpen)
  const pathname = usePathname()
  const { loading } = useAuth()
  const { user } = useSupabase()

  // Keep the ref updated with the latest state value
  React.useEffect(() => {
    sidebarOpenRef.current = sidebarOpen;
  }, [sidebarOpen]);

  // Initialize sidebar state based on screen size
  React.useEffect(() => {
    // Check if we're on a mobile device (adjust breakpoint as needed)
    const isMobile = window.innerWidth < 768;
    
    // Set initial state based on device type
    setSidebarOpen(!isMobile);
    
    // Optional: Handle window resizing
    const handleResize = () => {
      // Only auto-close if going from desktop to mobile
      if (window.innerWidth < 768 && sidebarOpenRef.current) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up event listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array means this runs once on mount

  const hiddenSidebarPaths = [
    '/splash', 
    '/auth/signin', 
    '/auth/signup'
  ]

  const publicRoutes = [
    '/pricing',
    '/pricing/success',
    '/pricing/cancelled'
  ]

  const showSidebar = !hiddenSidebarPaths.includes(pathname || '') && 
    (!!user || publicRoutes.some(route => pathname?.startsWith(route)))

  // For 404 pages, just show the content without the layout
  if (!pathname) {
    return <>{children}</>
  }

  // Preserve existing layout while auth is loading
  if (loading) {
    return (
      <div className="flex max-w-[100vw] overflow-x-hidden">
        {showSidebar && (
          <div className="w-72 !important bg-[#1B2559] animate-pulse" />
        )}
        <div 
          className={`flex-1 ${sidebarOpen ? '!ml-72' : '!ml-16'}`}
          style={{ marginLeft: sidebarOpen ? '18rem' : '4rem' }}
        >
          <div className="max-w-[1200px] w-full mx-auto px-4 relative flex flex-col">
            <div className="flex-1 pt-0">
              {children}
            </div>
            <div className="w-full">
              <Footer />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex max-w-[100vw] overflow-x-hidden">
      {showSidebar && (
        <SideMenu sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      )}     
      <div 
        className={`flex-1 ${sidebarOpen ? '!ml-72' : '!ml-16'}`}
        style={{ marginLeft: sidebarOpen ? '18rem' : '4rem' }}
      >
        <div className="max-w-[1200px] w-full mx-auto px-4 relative flex flex-col">
          <div className="flex-1 pt-4">
            {children}
          </div>
          <div className="w-full">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  )
}
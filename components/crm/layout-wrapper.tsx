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
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const pathname = usePathname()
  const { loading } = useAuth()
  const { user } = useSupabase()

  const hiddenSidebarPaths = ['/splash', '/auth/signin', '/auth/signup']
  const showSidebar = !hiddenSidebarPaths.includes(pathname || '') && !!user

  // For 404 pages, just show the content without the layout
  if (!pathname) {
    return <>{children}</>
  }

  // Preserve existing layout while auth is loading
  if (loading) {
    return (
      <div className="flex">
        {showSidebar && (
          <div className="w-72 bg-[#1B2559] animate-pulse" />
        )}
        <div className={`flex-1 ${sidebarOpen ? 'ml-72' : 'ml-16'}`}>
          <div className="max-w-[1200px] mx-auto px-4 relative flex flex-col ">
            <div className="flex-1 pt-0 ">
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
    <div className="flex">
      {showSidebar && (
        <SideMenu sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      )}     
      <div className={`flex-1 ${sidebarOpen ? 'ml-72' : 'ml-16'}`}>
        <div className="max-w-[1200px] mx-auto relative flex flex-col">
          <div className="pt-4">
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
"use client"

import * as React from "react"
import SideMenu from "@/components/crm/side-menu"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { useSupabase } from "@/components/providers/supabase-client-provider"

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
  const showSidebar = !hiddenSidebarPaths.includes(pathname) && !!user

  // Preserve existing layout while auth is loading
  if (loading) {
    return (
      <div className="flex min-h-screen">
        {showSidebar && (
          <div className="w-72 bg-[#1B2559] animate-pulse" />
        )}
        <div className={`flex-1 ${sidebarOpen ? 'ml-72' : 'ml-16'}`}>
          <div className="max-w-[1200px] mx-auto px-4 relative">
            <div className="pt-10">
              {children}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {showSidebar && (
        <SideMenu sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      )}     
      <div className={`flex-1 ${sidebarOpen ? 'ml-72' : 'ml-16'}`}>
        <div className="max-w-[1200px] mx-auto px-4 relative">
          <div className="pt-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
} 
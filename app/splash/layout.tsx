import * as React from "react"
import type { Metadata } from "next";       
import { usePathname } from "next/navigation";
import SideMenu from "@/components/crm/side-menu";
interface RootLayoutProps {
    children: React.ReactNode
  }

export const metadata = {
  template: null // This tells Next.js not to use the template for this route
}

export default function SplashLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative w-full min-h-screen overflow-y-auto overflow-x-hidden">
      {children}
    </div>
  )
}
  
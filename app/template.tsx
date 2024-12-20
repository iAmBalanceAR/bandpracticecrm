'use client'

import LayoutWrapper from '@/components/crm/layout-wrapper'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/components/providers/auth-provider'
import SupabaseProvider from '@/components/providers/supabase-client-provider'
import { Toaster } from "@/components/ui/toaster"

export default function Template({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Don't wrap splash page with layout wrapper
  if (pathname === '/splash') {
    return <>{children}</>
  }

  return (
    <SupabaseProvider session={null}>
      <AuthProvider>
        <LayoutWrapper>{children}</LayoutWrapper>
        <Toaster />
      </AuthProvider>
    </SupabaseProvider>
  )
} 
'use client'

import LayoutWrapper from '@/components/crm/layout-wrapper'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/components/providers/auth-provider'

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
    <AuthProvider>
      <LayoutWrapper>{children}</LayoutWrapper>
    </AuthProvider>
  )
} 
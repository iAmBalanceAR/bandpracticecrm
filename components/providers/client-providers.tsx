'use client'

import { ThemeProvider } from '@/lib/providers/theme-provider'
import MobileProvider from '@/components/providers/mobile-provider'
import SupabaseProvider from '@/components/providers/supabase-client-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { TourProvider } from '@/components/providers/tour-provider'
export default function ClientProviders({
  children,
  session
}: {
  children: React.ReactNode
  session: any
}) {
  return (
    <SupabaseProvider initialSession={session}>
      <AuthProvider>
        <TourProvider>
          <MobileProvider>
            <ThemeProvider
              defaultTheme="system"
              storageKey="ui-theme"
              enableSystem
            >
              {children}
            </ThemeProvider>
          </MobileProvider>
        </TourProvider>
      </AuthProvider>
    </SupabaseProvider>
  )
} 
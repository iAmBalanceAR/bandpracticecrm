import './globals.css'
import type { Metadata, Viewport } from 'next'
import { createClient } from '@/utils/supabase/server'
import SupabaseClientProvider from '@/components/providers/supabase-client-provider'
import MobileProvider from '@/components/providers/mobile-provider'
import type { Database } from '@/types/supabase'
import { ClientErrorBoundary } from '@/components/error/client-error-boundary'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export const metadata: Metadata = {
  title: 'Band Practice Agent',
  description: 'Your band practice companion',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  themeColor: '#000000',
  metadataBase: new URL('http://localhost:3000'),
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
    url: true,
  },
}

export const dynamic = 'force-dynamic'

interface RootLayoutProps {
  children: React.ReactNode
}

async function getSupabaseSession() {
  const supabase = createClient()
  
  try {
    const [userResponse, sessionResponse] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession()
    ])

    return {
      user: userResponse.data.user,
      session: sessionResponse.data.session,
      error: userResponse.error
    }
  } catch (error) {
    console.error('Error fetching Supabase session:', error)
    return { user: null, session: null, error }
  }
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const { session } = await getSupabaseSession()

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <ClientErrorBoundary>
          <SupabaseClientProvider session={session}>
            <MobileProvider>
              {children}
            </MobileProvider>
          </SupabaseClientProvider>
        </ClientErrorBoundary>
      </body>
    </html>
  )
} 
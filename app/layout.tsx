import './globals.css'
import type { Metadata, Viewport } from 'next'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Band Practice Agent',
  },
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
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
  
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
  const { user, session, error } = await getSupabaseSession()

  if (error) {
    console.error('Error getting user:', error)
  }

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-black text-base selection:bg-primary selection:text-white">
        <ClientErrorBoundary>
          <SupabaseClientProvider session={session}>
            <MobileProvider>
              <div className="flex min-h-full flex-col">
                {children}
              </div>
            </MobileProvider>
          </SupabaseClientProvider>
        </ClientErrorBoundary>
      </body>
    </html>
  )
} 
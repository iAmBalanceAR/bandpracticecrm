import './globals.css'
import type { Metadata, Viewport } from 'next'
import { createClient } from '@/utils/supabase/server'
import SupabaseClientProvider from '@/components/providers/supabase-client-provider'
import MobileProvider from '@/components/providers/mobile-provider'
import type { Database } from '@/types/supabase'
import { ClientErrorBoundary } from '@/components/error/client-error-boundary'
import 'leaflet/dist/leaflet.css';
import { ThemeProvider } from '@/lib/providers/theme-provider';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from '@/components/ui/toaster'
// import { RemindersAlertSystem } from '@/components/reminders/reminders-alert-system'
// import { PostHogProvider } from './providers'
import { TrialCountdown } from '@/components/ui/trial-countdown'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export const metadata: Metadata = {
  title: 'Band Practice CRM',
  description: 'Tour Management Simplified',
  metadataBase: new URL('https://app.bandpracticecrm.com'),
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
  const supabase = createClient();

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    // AuthSessionMissingError is expected for new visitors, not a true error
    if (error && error.name !== 'AuthSessionMissingError') {
      console.error('Error fetching user:', error);
      return { user: null, session: null, error };
    }

    // For new visitors or AuthSessionMissingError, just return null values without error
    if (!user || (error && error.name === 'AuthSessionMissingError')) {
      return { user: null, session: null, error: null };
    }

    // If you need the session object for other purposes, you can still retrieve it
    // after ensuring the user is authenticated.
    const { data: { session } } = await supabase.auth.getSession();

    return { user, session, error: null };
  } catch (error) {
    console.error('Error fetching Supabase session:', error);
    return { user: null, session: null, error };
  }
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const { session } = await getSupabaseSession();

  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="h-full bg-[#020817] font-sans antialiased">
        <Analytics />
        <ClientErrorBoundary>
          <SupabaseClientProvider initialSession={session}>
            <MobileProvider>
              <ThemeProvider
                defaultTheme="system"
                storageKey="ui-theme"
                enableSystem
              >
                <div className="relative flex min-h-screen flex-col">
                  <main className="flex-1 flex flex-col">
                    {children}
                  </main>
                  <TrialCountdown />
                </div>
                <SpeedInsights />
              </ThemeProvider>
            </MobileProvider>
          </SupabaseClientProvider>
        </ClientErrorBoundary>
        <Toaster />
      </body>
    </html>
  )
}
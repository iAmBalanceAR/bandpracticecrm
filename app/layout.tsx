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
import { RemindersAlertSystem } from '@/components/reminders/reminders-alert-system'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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

    if (error) {
      console.error('Error fetching user:', error);
      return { user: null, session: null, error };
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
  const { session } = await getSupabaseSession()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className=" bg-background font-sans antialiased">
        <Analytics />
        <ClientErrorBoundary>
          <SupabaseClientProvider initialSession={session}>
            <MobileProvider>
              <ThemeProvider
                defaultTheme="system"
                storageKey="ui-theme"
                enableSystem
              >
                <div className="flex min-h-screen">
                  <main className="flex-1">{children}</main>
                </div>
                <SpeedInsights />
                <RemindersAlertSystem />
              </ThemeProvider>
            </MobileProvider>
          </SupabaseClientProvider>
        </ClientErrorBoundary>
        <Toaster />
      </body>
    </html>
  )
} 
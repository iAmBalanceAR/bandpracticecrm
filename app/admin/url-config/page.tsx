'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getURL } from '@/utils/get-url'

export default function UrlConfigPage() {
  const [urlInfo, setUrlInfo] = useState<{
    getUrlResult: string;
    envVars: Record<string, string | undefined>;
  } | null>(null)

  useEffect(() => {
    // Get the URL from the getURL function
    const url = getURL()
    
    // Collect relevant environment variables
    const envVars = {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
      NODE_ENV: process.env.NODE_ENV,
    }
    
    setUrlInfo({
      getUrlResult: url,
      envVars,
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#0f1729] p-8">
      <h1 className="text-3xl font-mono text-white mb-8">
        <span className="text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          URL Configuration
        </span>
      </h1>
      
      <div className="grid gap-6">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle>Current URL Configuration</CardTitle>
            <CardDescription className="text-white/70">
              This shows the current URL configuration used by the application
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {urlInfo ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white">getURL() Result:</h3>
                  <p className="text-xl font-mono bg-black/20 p-3 rounded mt-2 border border-white/10 text-white">
                    {urlInfo.getUrlResult}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white">Environment Variables:</h3>
                  <pre className="text-sm overflow-auto p-3 bg-black/30 rounded mt-2 border border-white/10 text-white/90">
                    {JSON.stringify(urlInfo.envVars, null, 2)}
                  </pre>
                </div>
                
                <div className="bg-amber-900/30 border border-amber-700/50 p-4 rounded">
                  <h3 className="text-lg font-medium text-amber-300">Important Notes:</h3>
                  <ul className="list-disc list-inside mt-2 text-amber-200 space-y-2">
                    <li>The application uses the URL from getURL() for all Stripe callbacks and redirects</li>
                    <li>Make sure this URL is correctly configured in your Stripe Dashboard</li>
                    <li>Webhook endpoints should be configured to point to this domain + /api/webhooks/stripe</li>
                    <li>If you're seeing environment mismatches, ensure your Stripe keys match this environment</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-40">
                <p className="text-white/50">Loading URL configuration...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
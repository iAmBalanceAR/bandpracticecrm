'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRightIcon, GlobeIcon } from 'lucide-react'

export default function UrlConfigButton() {
  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GlobeIcon className="h-5 w-5" />
          URL Configuration
        </CardTitle>
        <CardDescription className="text-white/70">
          View and verify the application URL settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-white/70">
          Check the current URL configuration used for Stripe callbacks and webhooks. Ensure your environment is correctly set up.
        </p>
        <Link href="/admin/url-config" passHref>
          <Button className="bg-white/10 hover:bg-white/20 text-white">
            View URL Configuration
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
} 
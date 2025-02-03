import React from 'react'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1B2559] rounded-lg shadow p-6 border border-blue-600">
          <h2 className="text-2xl font-bold text-[#43A7C5] mb-6 text-center">Authentication Error</h2>
          
          <Alert variant="destructive" className="bg-red-900 border-red-600 mb-6">
            <AlertDescription>
              The authentication code is invalid or has expired. Please try again.
            </AlertDescription>
          </Alert>

          <div className="text-center">
            <Link 
              href="/auth/signin"
              className="text-blue-400 hover:text-blue-500 hover:underline"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 
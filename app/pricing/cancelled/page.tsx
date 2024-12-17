import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CancelledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg text-center">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Subscription Cancelled
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          The subscription process was cancelled. No charges were made.
        </p>
        <div className="mt-6 space-y-4">
          <Button asChild variant="default" className="w-full">
            <Link href="/pricing">
              Try Again
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 
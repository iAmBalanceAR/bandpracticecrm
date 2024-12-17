import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg text-center">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Subscription Successful!
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Thank you for subscribing. Your account has been successfully upgraded.
        </p>
        <div className="mt-6">
          <Button asChild className="w-full">
            <Link href="/">
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 
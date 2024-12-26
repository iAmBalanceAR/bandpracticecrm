import React from 'react'
import { AuthForm } from '@/components/auth/auth-form'
import Link from 'next/link'

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Or{' '}
            <Link href="/auth/signup" className="font-medium text-primary hover:text-primary/90 hover:underline">
              Register a new account.
            </Link>
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
} 
import React from 'react'
import { SignUpForm } from '@/components/auth/signup-form'
import Image from 'next/image'
import Link from 'next/link'

export default function SignUp() {
  return (
    <>
      <div className="relative h-screen">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Image 
                src="/images/logo-full.png" 
                alt="logo" 
                width={863} 
                height={160}
                className="mx-auto"
           />
          <div className="justify-center items-center">
            <SignUpForm />
            <p className="mt-2 text-sm text-muted-foreground text-white mx-auto text-center">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium text-base hover:text-blue-500/90 text-blue-400 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
} 
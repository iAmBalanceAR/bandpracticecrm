import React from 'react'
import { AuthForm } from '@/components/auth/auth-form'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import CustomSectionHeader from "@/components/common/CustomSectionHeader"

export default function SignIn() {
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
           <div className=" justify-center items-center">
            <AuthForm />
            <p className="mt-2 text-sm text-muted-foreground text-white mx-auto text-center">
                Don't have an account?&nbsp;
                 <Link href="/auth/signup" className="font-medium text-base hover:text-blue-500/90 text-blue-400 hover:underline">
                    Register one  for free.
                </Link>
            </p>
            </div>
            </div>
            </div>
      </>
    )
} 
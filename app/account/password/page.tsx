import React from 'react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ChangePasswordForm from '@/components/account/change-password-form'
import type { Database } from '@/types/supabase'

export default async function ChangePasswordPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-card-foreground mb-6">Change Password</h2>
          <ChangePasswordForm isOpen={true} onClose={() => redirect('/account')} />
        </div>
      </div>
    </div>
  )
} 
import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ChangePasswordForm from '@/components/account/change-password-form'

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  const supabase = createClient()
  const code = searchParams.code
  
  // If there's a reset code, we don't need to check for user session
  if (!code) {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      redirect('/auth/signin')
    }
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-card-foreground mb-6">
            {code ? 'Reset Password' : 'Change Password'}
          </h2>
          <ChangePasswordForm 
            isOpen={true} 
            onClose={() => redirect('/account')} 
            resetCode={code}
          />
        </div>
      </div>
    </div>
  )
} 
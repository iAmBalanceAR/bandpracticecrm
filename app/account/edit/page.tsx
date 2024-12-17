import React from 'react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import EditProfileForm from '@/components/account/edit-profile-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Database } from '@/types/supabase'

export default async function EditProfilePage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      throw new Error('Authentication error')
    }

    if (!user) {
      redirect('/auth/signin')
    }

    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-card-foreground mb-6">Edit Profile</h2>
            <EditProfileForm user={user} isOpen={true} onClose={() => redirect('/account')} />
          </div>
        </div>
      </div>
    )

  } catch (error) {
    console.error('Profile page error:', error)
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-card-foreground mb-6">Error</h2>
            <Alert variant="destructive">
              <AlertDescription>
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    )
  }
} 
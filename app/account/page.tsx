'use client'

import React, { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { ProfileAvatar } from '@/components/account/profile-avatar'
import EditProfileForm from '@/components/account/edit-profile-form'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/supabase'
import ChangePasswordForm from '@/components/account/change-password-form'

export default function AccountPage() {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const supabase = createClientComponentClient<Database>()
  const [user, setUser] = React.useState<any>(null)
  const [profile, setProfile] = React.useState<any>(null)

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        redirect('/auth/signin')
      }
      setUser(user)

      // Get subscription status
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()
      
      setProfile(profile)
    }

    getUser()
  }, [supabase])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0f1729] text-white">
      <div className="pl-4 pt-3">
        <h1 className="text-4xl font-mono mb-4">
          <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
            Account Settings
          </span>
        </h1>
        <div className="border-[#ff9920] border-b-2 -mt-8 mb-4 w-[100%] h-4"></div>
        
        <div className="pr-6 pl-8 pb-6 pt-4 bg-[#131d43] text-white min-h-[500px] shadow-sm shadow-green-400 rounded-md border-blue-800 border">
          <div className="space-y-8">
            {/* Profile Section */}
            <div className="bg-[#1B2559] rounded-lg shadow-md p-6 border border-blue-800">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-full">
              <div className="float-right">
                <ProfileAvatar 
                  avatarUrl={user.user_metadata?.avatar_url} 
                  alt={user.user_metadata?.full_name || user.email}
                  className="w-30 h-30"
                  iconClassName="h-30 w-30"
                />
                <div className='text-center mt-2 italic text-gray-400'>
                  Current Prfile Image
                </div>
                </div>                  
                  <h2 className="text-2xl font-bold text-white">
                    {user.user_metadata?.full_name || user.email}
                  </h2>
                  {user.user_metadata?.full_name && (
                    <p className="text-sm text-gray-400">{user.email}</p>
                  )}
                <div>
                  <label className="text-sm font-medium text-gray-400">Email</label>
                  <p className="mt-1 text-white">{user.email}</p>
                </div>    
                <div>
                  <label className="text-sm font-medium text-gray-400">Full Name</label>
                  <p className="mt-1 text-white">{user.user_metadata?.full_name || 'Not set'}</p>
                </div>       
                <div className="mt-6">
                <Button 
                  onClick={() => setIsEditProfileOpen(true)}
                  className="bg-green-700 text-white hover:bg-green-600"
                >
                  Edit Profile
                </Button>
              </div>                                       
                </div>
              </div>
            </div>

            {/* Subscription Section */}
            <div className="bg-[#1B2559] rounded-lg shadow-md p-6 border border-blue-800">
              <h2 className="text-2xl font-bold text-white mb-6">Subscription</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Current Plan</label>
                  <p className="mt-1 text-white capitalize">
                    {profile?.subscription_status ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-900 text-green-100 border border-green-600">
                        {profile.subscription_status}
                      </span>
                    ) : (
                      'No active subscription'
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-6 space-x-4">
                {profile?.subscription_status ? (
                  <Button asChild variant="outline" className="border-green-600 hover:bg-green-900/50">
                    <Link href="/account/billing">
                      Manage Subscription
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="bg-green-700 text-white hover:bg-green-600">
                    <Link href="/pricing">
                      View Plans
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-[#1B2559] rounded-lg shadow-md p-6 border border-blue-800">
              <h2 className="text-2xl font-bold text-white mb-6">Security</h2>
              <div className="space-y-4">
                <Button asChild
                  variant="outline" 
                  className="bg-green-700 text-white hover:bg-green-600 hover:text-white border-0"
                  onClick={() => setIsChangePasswordOpen(true)}
                >
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditProfileForm 
        user={user}
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      <ChangePasswordForm 
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  )
} 
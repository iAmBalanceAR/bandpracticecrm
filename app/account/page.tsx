'use client'

import React, { useState, useEffect } from 'react'
import createClient from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { ProfileAvatar } from '@/components/account/profile-avatar'
import EditProfileForm from '@/components/account/edit-profile-form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/supabase'
import ChangePasswordForm from '@/components/account/change-password-form'
import { Card } from '@/components/ui/card'

export default function AccountPage() {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  return (
    <div className="pl-4 pt-3 bg-[#0f1729] text-white min-h-screen">
      <h1 className="text-4xl font-mono mb-4">
        <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          Account Settings
        </span>
      </h1>
      <div className="border-[#ff9920] border-b-2 -mt-8 mb-4 w-[100%] h-4"></div>
      
      <div className="pr-6 pl-8 pb-6 pt-4 bg-[#131d43] text-white min-h-[500px] shadow-sm shadow-green-400 rounded-md border-blue-800 border">
        <Card className="bg-[#1B2559] border-blue-800">
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <ProfileAvatar 
                  avatarUrl={user?.user_metadata?.avatar_url}
                  alt={user?.user_metadata?.full_name || 'User'}
                  className="h-16 w-16"
                  iconClassName="h-8 w-8"
                />
                <div>
                  <h2 className="text-2xl font-bold text-white">{user?.user_metadata?.full_name || user?.email}</h2>
                  <p className="text-gray-400">{user?.email}</p>
                </div>
              </div>
              <Button onClick={handleSignOut} variant="destructive" className="bg-red-900 hover:bg-red-800">
                Sign Out
              </Button>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-[#111c44] rounded-lg border border-blue-800">
                <div>
                  <h3 className="text-lg font-medium text-white">Profile</h3>
                  <p className="text-gray-400 text-sm">Update your personal information</p>
                </div>
                <Button
                  onClick={() => setIsEditProfileOpen(true)}
                  variant="outline"
                  className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                >
                  Edit Profile
                </Button>
              </div>

              <div className="flex justify-between items-center p-4 bg-[#111c44] rounded-lg border border-blue-800">
                <div>
                  <h3 className="text-lg font-medium text-white">Password</h3>
                  <p className="text-gray-400 text-sm">Change your password</p>
                </div>
                <Button
                  onClick={() => setIsChangePasswordOpen(true)}
                  variant="outline"
                  className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                >
                  Change Password
                </Button>
              </div>

              <div className="flex justify-between items-center p-4 bg-[#111c44] rounded-lg border border-blue-800">
                <div>
                  <h3 className="text-lg font-medium text-white">Billing</h3>
                  <p className="text-gray-400 text-sm">Manage your subscription and billing information</p>
                </div>
                <Link href="/account/billing">
                  <Button 
                    variant="outline"
                    className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
                  >
                    Manage Billing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
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
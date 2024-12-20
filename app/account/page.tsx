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
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <ProfileAvatar 
                  avatarUrl={user?.user_metadata?.avatar_url}
                  alt={user?.user_metadata?.full_name || 'User'}
                  className="h-16 w-16"
                  iconClassName="h-8 w-8"
                />
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground">Account Settings</h2>
                  <p className="text-muted-foreground">Manage your account settings and preferences</p>
                </div>
              </div>
              <Button onClick={handleSignOut} variant="destructive">
                Sign Out
              </Button>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <dl className="divide-y divide-border">
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-card-foreground">Profile</dt>
                  <dd className="mt-1 flex justify-between items-center text-sm text-muted-foreground sm:col-span-2 sm:mt-0">
                    <span>Update your personal information</span>
                    <Button
                      onClick={() => setIsEditProfileOpen(true)}
                      variant="outline"
                      size="sm"
                    >
                      Edit Profile
                    </Button>
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-card-foreground">Password</dt>
                  <dd className="mt-1 flex justify-between items-center text-sm text-muted-foreground sm:col-span-2 sm:mt-0">
                    <span>Change your password</span>
                    <Button
                      onClick={() => setIsChangePasswordOpen(true)}
                      variant="outline"
                      size="sm"
                    >
                      Change Password
                    </Button>
                  </dd>
                </div>

                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-card-foreground">Billing</dt>
                  <dd className="mt-1 flex justify-between items-center text-sm text-muted-foreground sm:col-span-2 sm:mt-0">
                    <span>Manage your subscription and billing information</span>
                    <Link href="/account/billing">
                      <Button variant="outline" size="sm">
                        Manage Billing
                      </Button>
                    </Link>
                  </dd>
                </div>
              </dl>
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
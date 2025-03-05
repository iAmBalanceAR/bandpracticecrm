"use client"

import React from 'react'
import { ProgressiveCard } from '../utils/progressive-card'
import { useSupabase } from '@/components/providers/supabase-client-provider'
import { ProfileAvatar } from '@/components/account/profile-avatar'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { CreditCard, User, BarChart3, LogOut } from 'lucide-react'

export const UserProfileCard: React.FC = () => {
  const { user, supabase } = useSupabase()
  const router = useRouter()
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }
  
  if (!user) {
    return (
      <ProgressiveCard
        title="Account"
        color="[#00e396]"
        className="p-4"
      >
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          <p className="text-gray-400 text-center">
            Sign in to access your account
          </p>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push('/auth/signin')}
          >
            Sign In
          </Button>
        </div>
      </ProgressiveCard>
    )
  }
  
  return (
    <ProgressiveCard
      title="Your Account"
      color="[#00e396]"
      className="p-4"
    >
      <div className="space-y-4">
        {/* Profile header */}
        <div className="flex items-center space-x-4">
          <ProfileAvatar 
            avatarUrl={user?.user_metadata?.avatar_url} 
            alt={user?.user_metadata?.full_name || user?.email || ''}
            className="w-16 h-16 rounded-md border-2 border-green-600/50"
            iconClassName="h-8 w-8"
          />
          <div>
            <h3 className="text-lg font-medium text-white">
              {user?.user_metadata?.full_name || 'Band Member'}
            </h3>
            <p className="text-sm text-gray-400">
              {user?.email}
            </p>
          </div>
        </div>
        
        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button 
            variant="outline" 
            className="flex items-center justify-start gap-2 text-white border-green-600/30 hover:bg-green-900/20"
            onClick={() => router.push('/account')}
          >
            <User className="h-4 w-4 text-green-400" />
            <span>Profile</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center justify-start gap-2 text-white border-blue-600/30 hover:bg-blue-900/20"
            onClick={() => router.push('/account/billing')}
          >
            <CreditCard className="h-4 w-4 text-blue-400" />
            <span>Billing</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center justify-start gap-2 text-white border-yellow-600/30 hover:bg-yellow-900/20"
            onClick={() => router.push('/account/user-stats')}
          >
            <BarChart3 className="h-4 w-4 text-yellow-400" />
            <span>Usage</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center justify-start gap-2 text-white border-red-600/30 hover:bg-red-900/20"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 text-red-400" />
            <span>Sign Out</span>
          </Button>
        </div>
        
        {/* Subscription status */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Subscription</span>
            <span className="text-sm bg-green-700 text-white px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
        </div>
      </div>
    </ProgressiveCard>
  )
} 
'use client'

import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useSupabase } from '../providers/supabase-client-provider'
import { useCallback } from 'react'

export function UserNav() {
  const { supabase } = useSupabase()
  const router = useRouter()

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }, [supabase.auth, router])

  const handleProfileClick = useCallback(() => {
    router.push('/account')
  }, [router])

  const handleBillingClick = useCallback(() => {
    router.push('/account/billing')
  }, [router])

  const handleSettingsClick = useCallback(() => {
    router.push('/account/settings')
  }, [router])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-[#111C44] border-[#1E293B] text-white">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">User</p>
            <p className="text-xs leading-none text-muted-foreground">
              user@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem 
            className="cursor-pointer hover:bg-[#1B2559]"
            onClick={handleProfileClick}
          >
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="cursor-pointer hover:bg-[#1B2559]"
            onClick={handleBillingClick}
          >
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="cursor-pointer hover:bg-[#1B2559]"
            onClick={handleSettingsClick}
          >
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer hover:bg-[#1B2559] text-red-400 hover:text-red-300"
          onClick={handleSignOut}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 
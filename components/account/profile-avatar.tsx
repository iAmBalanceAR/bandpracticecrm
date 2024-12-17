'use client'

import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileAvatarProps {
  avatarUrl?: string | null
  alt: string
  className?: string
  iconClassName?: string
}

export function ProfileAvatar({ avatarUrl, alt, className, iconClassName }: ProfileAvatarProps) {
  return (
    <div className={cn("rounded-md bg-[#1B2559] flex items-center justify-center overflow-hidden border border-green-600/50", className)}>
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={alt} 
          className="h-full w-full object-cover"
          onError={(e) => {
            // If image fails to load, show the user icon
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
          }}
        />
      ) : null}
      <User className={cn("text-white fallback-icon", iconClassName, avatarUrl ? 'hidden' : '')} />
    </div>
  )
} 
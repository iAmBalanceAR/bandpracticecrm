'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

export function UserBadge() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!error) {
        setUser(user)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      {user.email}
      {/* Add your badge UI here */}
    </div>
  )
} 
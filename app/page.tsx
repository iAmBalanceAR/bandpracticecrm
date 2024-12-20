import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { Database } from '@/types/supabase'
import { Dashboard } from '@/components/crm/dashboard'

export default async function Home() {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/auth/signin')
  } else {
    return <Dashboard />
  }
} 
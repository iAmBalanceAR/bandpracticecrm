import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.app_metadata?.is_super_admin) {
    redirect('/') // Silent redirect
  }

  return <div className="admin-container">{children}</div>
}

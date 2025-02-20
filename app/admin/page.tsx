import { ResendVerification } from '@/components/admin/resend-verification'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

const SyncStripeProducts = dynamic(
  () => import('@/components/admin/sync-stripe-products'),
  { ssr: false }
)

export default async function AdminPage() {
  const supabase = createClient()
  
  // Verify user is authenticated and has admin role
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-[#0f1729] p-8">
      <h1 className="text-3xl font-mono text-white mb-8">
        <span className="text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          Admin Tools
        </span>
      </h1>
      
      <div className="grid gap-8">
        <ResendVerification />
        <SyncStripeProducts />
        {/* Add more admin tools here */}
      </div>
    </div>
  )
} 
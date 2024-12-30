import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { TourDetailsWrapper } from '@/components/crm/tour-details-wrapper'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f1729]">
      <Loader2 className="h-8 w-8 animate-spin text-[#008ffb]" />
    </div>
  )
}

export default async function TourDetailsPage() {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) redirect('/auth/signin')

    return (
      <Suspense fallback={<LoadingSpinner />}>
        <TourDetailsWrapper />
      </Suspense>
    )
  } catch (error) {
    console.error('Error in TourDetailsPage:', error)
    redirect('/auth/signin')
  }
} 
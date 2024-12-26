import { createClient } from '@/utils/supabase/server'
import { cleanupDuplicateVenues } from '@/scripts/cleanup-venues'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const duplicatesRemoved = await cleanupDuplicateVenues()
    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${duplicatesRemoved} duplicate venues` 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
} 
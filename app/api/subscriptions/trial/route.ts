import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const url = new URL(request.url)
  const userId = url.searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('trial_start, trial_end')
      .eq('user_id', userId)
      .order('created', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    )
  }
}
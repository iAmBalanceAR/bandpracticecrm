import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ exists: false })
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    return NextResponse.json({ exists: !!data })
  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json({ exists: false })
  }
} 
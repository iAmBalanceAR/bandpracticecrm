import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    if (!type) {
      return new NextResponse('Type parameter is required', { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: templates, error } = await supabase
      .from('riders')
      .select('id, title, type')
      .eq('user_id', user.id)
      .eq('type', type)
      .eq('is_template', true)
      .order('title', { ascending: true })

    if (error) {
      console.error('Error fetching templates:', error)
      return new NextResponse('Internal Server Error', { status: 500 })
    }

    return NextResponse.json(templates || [])
  } catch (error) {
    console.error('Error in /api/riders/templates:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
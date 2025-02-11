import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type || !['technical', 'hospitality'].includes(type)) {
      return new NextResponse('Invalid rider type', { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createClient()

    const table = type === 'technical' ? 'technical_rider_sections' : 'hospitality_rider_sections'

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching rider sections:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
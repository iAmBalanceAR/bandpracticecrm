import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface RiderSectionContent {
  id: string
  section_id: string | null
  custom_section_name: string | null
  content: Record<string, any>
  sort_order: number
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Fetch the rider
    const { data: rider, error: riderError } = await supabase
      .from('riders')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (riderError) {
      console.error('Error fetching rider:', riderError)
      return new NextResponse('Internal Server Error', { status: 500 })
    }

    if (!rider) {
      return new NextResponse('Rider not found', { status: 404 })
    }

    // Fetch the rider sections with their content
    const { data: sections, error: sectionsError } = await supabase
      .from('rider_section_content')
      .select(`
        id,
        section_id,
        custom_section_name,
        content,
        sort_order
      `)
      .eq('rider_id', params.id)
      .order('sort_order', { ascending: true })

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError)
      return new NextResponse('Internal Server Error', { status: 500 })
    }

    // Transform sections data
    const transformedSections = (sections as RiderSectionContent[]).map((section) => ({
      id: section.section_id || `custom-${section.sort_order}`,
      name: section.custom_section_name || '',
      sort_order: section.sort_order,
      is_custom: !section.section_id,
      content: section.content
    }))

    return NextResponse.json({
      ...rider,
      sections: transformedSections
    })
  } catch (error) {
    console.error('Error in /api/riders/[id]:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
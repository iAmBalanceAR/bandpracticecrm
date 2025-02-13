import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Fetch input list data
    const { data: inputListData, error: inputListError } = await supabase
      .from('input_list')
      .select('*')
      .eq('rider_id', params.id)
      .order('channel_number', { ascending: true })

    if (inputListError) {
      console.error('Error fetching input list:', inputListError)
      return new NextResponse('Error fetching input list', { status: 500 })
    }

    return NextResponse.json(inputListData || [])
  } catch (error) {
    console.error('Error in input list route:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
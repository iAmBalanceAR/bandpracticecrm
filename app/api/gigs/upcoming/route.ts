import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient()

    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('No authenticated user found')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get the current tour
    const { data: currentTour, error: tourError } = await supabase
      .from('tours')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    if (tourError) {
      console.log('Error fetching current tour:', tourError)
      return NextResponse.json([])
    }

    if (!currentTour) {
      console.log('No default tour found')
      return NextResponse.json([])
    }

    // First get the gig IDs from tourconnect
    const { data: tourGigs, error: tourGigsError } = await supabase
      .from('tourconnect')
      .select('gig_id')
      .eq('tour_id', currentTour.id)
      .eq('user_id', user.id)

    if (tourGigsError) {
      console.log('Error fetching tour gigs:', tourGigsError)
      return NextResponse.json([])
    }

    const gigIds = tourGigs.map(tg => tg.gig_id)

    // Then get the gig details
    const { data: gigs, error: gigsError } = await supabase
      .from('gigs')
      .select(`
        id,
        title,
        gig_date
      `)
      .eq('user_id', user.id)
      .in('id', gigIds)
      .gte('gig_date', new Date().toISOString())
      .order('gig_date', { ascending: true })

    if (gigsError) {
      console.log('Error fetching gigs:', gigsError)
      throw gigsError
    }

    console.log('Successfully fetched gigs:', gigs?.length || 0, 'gigs found')
    return NextResponse.json(gigs || [])
  } catch (error) {
    console.error('Error in /api/gigs/upcoming:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
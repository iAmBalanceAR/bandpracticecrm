import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import CustomSectionHeader from '@/components/common/CustomSectionHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getRiderDetails } from '@/app/riders/actions'
import { RiderDetails } from '@/app/riders/components/rider-details'
import { notFound } from 'next/navigation'
import { StagePlot, StagePlotItem } from '@/app/stage-plot/types'
import { Setlist, SetlistItem, InputListRow } from '@/app/riders/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: {
    id: string
    type: 'technical' | 'hospitality'
  }
}

interface RiderSectionContent {
  id: string
  section_id: string | null
  custom_section_name: string | null
  content: string  // Content comes directly as HTML string
  sort_order: number
  technical_rider_sections?: {
    name: string
  } | null
  hospitality_rider_sections?: {
    name: string
  } | null
}

interface TransformedSection {
  id: string
  name: string
  sort_order: number
  is_custom: boolean
  is_default: boolean
  content: string
}

export default async function RiderDetailsPage({ params }: Props) {
  const cookieStore = cookies()
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('Auth check - User:', user?.id)

  if (!user) {
    console.log('No user found - returning 404')
    return notFound()
  }

  // Get the rider details
  console.log('Fetching rider with ID:', params.id)
  const { data: rider, error: riderError } = await supabase
    .from('riders')
    .select(`
      id,
      title,
      type,
      gig_id,
      stage_plot_id,
      setlist_id,
      created_at,
      updated_at,
      rider_section_content!inner (
        id,
        section_id,
        custom_section_name,
        content,
        sort_order
      )
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  console.log('Rider query error:', riderError)
  console.log('Rider data:', rider)

  if (!rider) {
    console.log('No rider found - returning 404')
    return notFound()
  }

  // Fetch section names if needed
  const sectionIds = rider.rider_section_content
    ?.filter(section => section.section_id)
    .map(section => section.section_id) || []

  let sectionNames: Record<string, string> = {}
  if (sectionIds.length > 0) {
    const { data: sections } = await supabase
      .from(params.type === 'technical' ? 'technical_rider_sections' : 'hospitality_rider_sections')
      .select('id, name')
      .in('id', sectionIds)

    sectionNames = (sections || []).reduce((acc, section) => ({
      ...acc,
      [section.id]: section.name
    }), {})
  }

  // Transform rider sections
  const sections = rider.rider_section_content?.map((section) => {
    const isCustomSection = !section.section_id || section.section_id === '00000000-0000-0000-0000-000000000000'
    return {
      id: section.id,
      name: isCustomSection ? section.custom_section_name : sectionNames[section.section_id] || 'Untitled Section',
      sort_order: section.sort_order,
      is_custom: isCustomSection,
      is_default: false,
      content: section.content  // Pass the content directly without wrapping
    }
  }).sort((a, b) => a.sort_order - b.sort_order) || []

  // Get the rider type-specific details
  type RiderDetailsType = {
    id: string;
    rider_id: string;
    sections?: {
      id: string;
      name: string;
      sort_order: number;
      is_custom: boolean;
      is_default: boolean;
      content: Record<string, any>;
    }[];
    input_list?: InputListRow[];
  }

  const riderDetails: RiderDetailsType = {
    id: rider.id,
    rider_id: rider.id,
    sections: sections
  }

  // For technical riders, get input list data
  if (params.type === 'technical') {
    const { data: inputListData, error: inputListError } = await supabase
      .from('input_list')
      .select('*')
      .eq('rider_id', params.id)
      .order('channel_number', { ascending: true })

    if (!inputListError) {
      console.log('Fetched input list data:', inputListData)
      riderDetails.input_list = inputListData || []
    } else {
      console.error('Error fetching input list:', inputListError)
    }
  }

  // Get associated gig details if there's a gig_id
  let gig = null
  if (rider.gig_id) {
    const { data: gigData } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', rider.gig_id)
      .single()
    gig = gigData
  }

  // For technical riders, get stage plot and setlist if they exist
  let stagePlot: StagePlot | undefined = undefined
  let stagePlotItems: StagePlotItem[] = []
  let setlist: Setlist | undefined = undefined
  let setlistItems: SetlistItem[] = []
  
  if (params.type === 'technical') {
    if (rider.stage_plot_id) {
      // Get stage plot and its items
      const [plotResult, itemsResult] = await Promise.all([
        supabase
          .from('stage_plots')
          .select('*')
          .eq('id', rider.stage_plot_id)
          .single(),
        supabase
          .from('stage_plot_items')
          .select('*')
          .eq('stage_plot_id', rider.stage_plot_id)
      ])
      
      if (!plotResult.error && plotResult.data) {
        stagePlot = plotResult.data
        stagePlotItems = itemsResult.error ? [] : itemsResult.data
      }
    }

    if (rider.setlist_id) {
      // Get setlist and its items
      const [setlistResult, itemsResult] = await Promise.all([
        supabase
          .from('setlists')
          .select('*')
          .eq('id', rider.setlist_id)
          .single(),
        supabase
          .from('setlist_songs')
          .select('*')
          .eq('setlist_id', rider.setlist_id)
          .order('sort_order', { ascending: true })
      ])
      
      if (!setlistResult.error && setlistResult.data) {
        setlist = {
          ...setlistResult.data,
          name: setlistResult.data.title // Map title to name for component compatibility
        }
        setlistItems = itemsResult.error ? [] : itemsResult.data
      }
    }
  }

  return (
    <CustomSectionHeader title={`${params.type.charAt(0).toUpperCase() + params.type.slice(1)} Rider Details`} underlineColor="#D83B34">
      <Card className="bg-[#111C44] min-h-[500px] border-none">
        <CardHeader className="pb-0 mb-0">
          <Link href="/riders" className="inline-block">
            <Button
              variant="ghost"
              className="flex text-right float-right gap-2 text-white hover:text-white bg-blue-600 hover:bg-blue-700 border-black border z-[100] mt-[4px]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Riders
            </Button>
          </Link>
          <CardTitle>
          <h3 className="text-3xl mb-0 font-normal font-mono p-0 -mt-[60px] z-[2] mr-[165px]">
            <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
              {rider.title}
            </span>
            <div className="border-[#ff9920] border-b-2 -mt-2 mb-4 w-[100%] h-2 z-[3] mr-[165px]"></div>
          </h3>            
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pt-2 pb-6">
          <RiderDetails 
            type={params.type}
            details={riderDetails}
            gig={gig}
            stagePlot={stagePlot}
            stagePlotItems={stagePlotItems}
            setlist={setlist}
            setlistItems={setlistItems}
          />
        </CardContent>
      </Card>
    </CustomSectionHeader>
  )
} 
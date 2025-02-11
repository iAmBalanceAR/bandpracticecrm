import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { RiderForm } from '@/app/riders/components/rider-form'
import { getStagePlots, getSetlists } from '@/app/riders/actions'
import CustomSectionHeader from '@/components/common/CustomSectionHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Rider } from '@/app/riders/types'

interface Props {
  params: {
    id: string
  }
}

export default async function EditTechnicalRider({ params }: Props) {
  const cookieStore = cookies()
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch the rider
  const { data: riderData } = await supabase
    .from('riders')
    .select(`
      id,
      title,
      type,
      is_template,
      stage_plot_id,
      setlist_id,
      gig_id,
      user_id,
      created_at,
      updated_at,
      version,
      rider_section_content (
        id,
        rider_id,
        section_id,
        custom_section_name,
        content,
        sort_order,
        name
      )
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  // Transform the data to match the Rider type
  const rider: Rider | undefined = riderData ? {
    id: riderData.id,
    user_id: riderData.user_id,
    title: riderData.title,
    type: riderData.type,
    is_template: riderData.is_template,
    stage_plot_id: riderData.stage_plot_id,
    setlist_id: riderData.setlist_id,
    gig_id: riderData.gig_id,
    created_at: riderData.created_at,
    updated_at: riderData.updated_at,
    version: riderData.version,
    sections: riderData.rider_section_content.map(section => ({
      id: section.section_id || `custom-${section.sort_order}`,
      name: section.custom_section_name || section.name || '',
      sort_order: section.sort_order,
      is_custom: !section.section_id || section.section_id === '00000000-0000-0000-0000-000000000000',
      is_default: false,
      content: section.content
    }))
  } : undefined

  console.log('Transformed rider data:', rider)

  // Fetch stage plots and setlists
  const stagePlots = await getStagePlots(user.id)
  const setlists = await getSetlists(user.id)

  return (
    <CustomSectionHeader title="Edit Technical Rider" underlineColor="#D83B34">
      <Card className="bg-[#111C44] min-h-[500px] border-none">
        <CardContent className="p-6">
          <RiderForm
            type="technical"
            initialData={rider}
            stagePlots={stagePlots}
            setlists={setlists}
          />
        </CardContent>
      </Card>
    </CustomSectionHeader>
  )
} 
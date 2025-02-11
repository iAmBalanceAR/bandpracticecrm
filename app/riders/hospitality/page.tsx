import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import CustomSectionHeader from '@/components/common/CustomSectionHeader'
import { Card, CardContent } from '@/components/ui/card'
import { RiderForm } from '../components/rider-form'
import { getStagePlots, getSetlists } from '../actions'
import { StagePlot } from '../types'

export default async function HospitalityRiderTool() {
  const cookieStore = cookies()
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [stagePlots, setlists] = await Promise.all([
    user ? getStagePlots(user.id) : [],
    user ? getSetlists(user.id) : []
  ])

  return (
    <CustomSectionHeader title="Hospitality Rider Tool" underlineColor="#D83B34">
      <Card className="bg-[#111C44] min-h-[500px] border-none">
        <CardContent className="p-6">
          {/* Page Content Begins */}
          <Suspense fallback={<div>Loading form...</div>}>
            <RiderForm
              type="hospitality"
              stagePlots={stagePlots as StagePlot[]}
              setlists={setlists}
            />
          </Suspense>
          {/* Page Content Ends */}
        </CardContent>
      </Card>
    </CustomSectionHeader>
  )
} 
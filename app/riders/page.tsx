import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import CustomSectionHeader from '@/components/common/CustomSectionHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getRiders } from './actions'
import { RiderListActions } from './components/rider-list-actions'
import { CardHeader, CardTitle } from '@/components/ui/card'
export default async function Riders() {
  const cookieStore = cookies()
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const riders = user ? await getRiders(user.id) : []

  return (
    <CustomSectionHeader title="Riders" underlineColor="#D83B34">
      <Card className="bg-[#111C44] min-h-[500px] border-none">
      <CardHeader className="pb-0 mb-0">
          <CardTitle className="text-2xl">
            <h3 className="font-mono text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
              Saved Riders
            </h3>  
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Page Content Begins */}
          <Tabs defaultValue="technical" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="technical">Technical Rider</TabsTrigger>
                <TabsTrigger value="hospitality">Hospitality Rider</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-4">
                <Link href="/riders/technical">
                  <Button variant="default" size="sm" className="gap-2  bg-green-700 text-white hover:bg-green-600">
                    <Plus className="h-4 w-4 mr-2" />
                    New Technical Rider
                  </Button>
                </Link>
                <Link href="/riders/hospitality">
                  <Button variant="default" size="sm" className="gap-2  bg-green-700 text-white hover:bg-green-600">
                    <Plus className="h-4 w-4 mr-2" />
                    New Hospitality Rider
                  </Button>
                </Link>
              </div>
            </div>

            <TabsContent value="technical">
              <Suspense fallback={<div>Loading technical riders...</div>}>
                <RiderListActions
                  type="technical"
                  riders={riders.filter(r => r.type === 'technical')}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="hospitality">
              <Suspense fallback={<div>Loading hospitality riders...</div>}>
                <RiderListActions
                  type="hospitality"
                  riders={riders.filter(r => r.type === 'hospitality')}
                />
              </Suspense>
            </TabsContent>
          </Tabs>
          {/* Page Content Ends */}
        </CardContent>
      </Card>
    </CustomSectionHeader>
  )
} 
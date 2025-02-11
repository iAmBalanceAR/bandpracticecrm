import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { Rider, TechnicalRiderDetails, HospitalityRiderDetails, StagePlot } from '../types'

export async function getRiders(userId: string) {
  const cookieStore = cookies()
  const supabase = createClient()

  const { data: riders, error } = await supabase
    .from('riders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching riders:', error)
    throw error
  }

  return riders as Rider[]
}

export async function getRiderDetails(riderId: string, type: 'technical' | 'hospitality') {
  const cookieStore = cookies()
  const supabase = createClient()

  const table = type === 'technical' ? 'technical_rider_details' : 'hospitality_rider_details'

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('rider_id', riderId)
    .single()

  if (error) {
    console.error(`Error fetching ${type} rider details:`, error)
    throw error
  }

  return data as TechnicalRiderDetails | HospitalityRiderDetails
}

type TechnicalRiderData = {
  type: 'technical'
  pa_system?: Record<string, any>
  mixing_console?: Record<string, any>
  monitoring?: Record<string, any>
  microphones?: Record<string, any>
  backline?: Record<string, any>
  lighting?: Record<string, any>
  stage_requirements?: Record<string, any>
  power_requirements?: Record<string, any>
  additional_requirements?: Record<string, any>
}

type HospitalityRiderData = {
  type: 'hospitality'
  dressing_room?: Record<string, any>
  catering?: Record<string, any>
  beverages?: Record<string, any>
  meals?: Record<string, any>
  hotel?: Record<string, any>
  transportation?: Record<string, any>
  parking?: Record<string, any>
  security?: Record<string, any>
  merchandise?: Record<string, any>
  additional_requirements?: Record<string, any>
}

type BaseRiderData = {
  title: string
  is_template?: boolean
  stage_plot_id?: string
  setlist_id?: string
}

type CreateRiderData = BaseRiderData & (TechnicalRiderData | HospitalityRiderData)

export async function createRider(userId: string, data: CreateRiderData) {
  const cookieStore = cookies()
  const supabase = createClient()

  // First, create the rider
  const { data: rider, error: riderError } = await supabase
    .from('riders')
    .insert([{
      user_id: userId,
      title: data.title,
      type: data.type,
      is_template: data.is_template,
      stage_plot_id: data.stage_plot_id,
      setlist_id: data.setlist_id,
    }])
    .select()
    .single()

  if (riderError) {
    console.error('Error creating rider:', riderError)
    throw riderError
  }

  // Then, create the rider details
  const detailsTable = data.type === 'technical' ? 'technical_rider_details' : 'hospitality_rider_details'
  const detailsData = {
    rider_id: rider.id,
    ...(data.type === 'technical' ? {
      pa_system: data.pa_system,
      mixing_console: data.mixing_console,
      monitoring: data.monitoring,
      microphones: data.microphones,
      backline: data.backline,
      lighting: data.lighting,
      stage_requirements: data.stage_requirements,
      power_requirements: data.power_requirements,
      additional_requirements: data.additional_requirements,
    } : {
      dressing_room: data.dressing_room,
      catering: data.catering,
      beverages: data.beverages,
      meals: data.meals,
      hotel: data.hotel,
      transportation: data.transportation,
      parking: data.parking,
      security: data.security,
      merchandise: data.merchandise,
      additional_requirements: data.additional_requirements,
    })
  }

  const { error: detailsError } = await supabase
    .from(detailsTable)
    .insert([detailsData])

  if (detailsError) {
    // If details creation fails, delete the rider
    await supabase.from('riders').delete().eq('id', rider.id)
    console.error('Error creating rider details:', detailsError)
    throw detailsError
  }

  return rider
}

type UpdateRiderData = Partial<BaseRiderData> & Partial<TechnicalRiderData> & Partial<HospitalityRiderData>

export async function updateRider(riderId: string, data: UpdateRiderData) {
  const cookieStore = cookies()
  const supabase = createClient()

  // Update rider
  const { error: riderError } = await supabase
    .from('riders')
    .update({
      title: data.title,
      is_template: data.is_template,
      stage_plot_id: data.stage_plot_id,
      setlist_id: data.setlist_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', riderId)

  if (riderError) {
    console.error('Error updating rider:', riderError)
    throw riderError
  }

  if (!data.type) return

  // Update rider details
  const detailsTable = data.type === 'technical' ? 'technical_rider_details' : 'hospitality_rider_details'
  const detailsData = data.type === 'technical' ? {
    pa_system: data.pa_system,
    mixing_console: data.mixing_console,
    monitoring: data.monitoring,
    microphones: data.microphones,
    backline: data.backline,
    lighting: data.lighting,
    stage_requirements: data.stage_requirements,
    power_requirements: data.power_requirements,
    additional_requirements: data.additional_requirements,
  } : {
    dressing_room: data.dressing_room,
    catering: data.catering,
    beverages: data.beverages,
    meals: data.meals,
    hotel: data.hotel,
    transportation: data.transportation,
    parking: data.parking,
    security: data.security,
    merchandise: data.merchandise,
    additional_requirements: data.additional_requirements,
  }

  const { error: detailsError } = await supabase
    .from(detailsTable)
    .update(detailsData)
    .eq('rider_id', riderId)

  if (detailsError) {
    console.error('Error updating rider details:', detailsError)
    throw detailsError
  }
}

export async function deleteRider(riderId: string) {
  const cookieStore = cookies()
  const supabase = createClient()

  const { error } = await supabase
    .from('riders')
    .delete()
    .eq('id', riderId)

  if (error) {
    console.error('Error deleting rider:', error)
    throw error
  }
}

export async function getStagePlots(userId: string) {
  const cookieStore = cookies();
  const supabase = createClient();

  const { data: stagePlots, error } = await supabase
    .from('stage_plots')
    .select('id, user_id, name, stage_width, stage_depth, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stage plots:', error);
    throw error;
  }

  return stagePlots;
}

export async function getSetlists(userId: string) {
  const cookieStore = cookies()
  const supabase = createClient()

  const { data: setlists, error } = await supabase
    .from('setlists')
    .select('id, title')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching setlists:', error)
    throw error
  }

  return setlists
}

export async function getUserStagePlots(userId: string): Promise<StagePlot[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('stage_plots')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing stage plots for user:', error);
    return [];
  }

  return data as StagePlot[];
} 
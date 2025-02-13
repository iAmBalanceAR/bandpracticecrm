'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Rider, TechnicalRiderDetails, HospitalityRiderDetails } from './types'

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
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching ${type} rider details:`, error)
    throw error
  }

  // If no details exist, return an empty object with the rider_id
  if (!data) {
    return {
      rider_id: riderId,
      sections: {}
    } as TechnicalRiderDetails | HospitalityRiderDetails
  }

  return data as TechnicalRiderDetails | HospitalityRiderDetails
}

export async function createRider({
  type,
  title,
  is_template,
  stage_plot_id,
  setlist_id,
  gig_id,
  sections
}: {
  type: 'technical' | 'hospitality'
  title: string
  is_template?: boolean
  gig_id?: string
  stage_plot_id?: string
  setlist_id?: string
  sections: {
    section_id: string | null
    custom_section_name: string | null
    content: Record<string, any>
    sort_order: number
  }[]
}) {
  const cookieStore = cookies()
  const supabase = createClient()

  try {
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // First, create the rider
    const { data: rider, error: riderError } = await supabase
      .from('riders')
      .insert([{
        user_id: user.id,
        title,
        type,
        is_template,
        stage_plot_id,
        setlist_id,
        gig_id,
      }])
      .select()
      .single()

    if (riderError) throw riderError

    // Then, create the rider sections
    const { error: sectionsError } = await supabase
      .from('rider_section_content')
      .insert(
        sections.map(section => ({
          rider_id: rider.id,
          section_id: section.section_id,
          custom_section_name: section.custom_section_name,
          content: section.content,
          sort_order: section.sort_order,
        }))
      )

    if (sectionsError) {
      // If sections creation fails, delete the rider
      await supabase.from('riders').delete().eq('id', rider.id)
      throw sectionsError
    }

    revalidatePath('/riders')
    return { success: true, data: rider }
  } catch (error) {
    console.error('Error creating rider:', error)
    return { success: false, error }
  }
}

export async function updateRider({
  riderId,
  type,
  title,
  is_template,
  stage_plot_id,
  setlist_id,
  gig_id,
  sections
}: {
  riderId: string
  type: 'technical' | 'hospitality'
  title?: string
  is_template?: boolean
  stage_plot_id?: string
  setlist_id?: string
  gig_id?: string
  sections: {
    section_id: string | null
    custom_section_name: string | null
    content: Record<string, any>
    sort_order: number
  }[]
}) {
  const cookieStore = cookies()
  const supabase = createClient()

  try {
    // Update rider
    if (title || is_template || stage_plot_id || setlist_id || gig_id !== undefined) {
      const { error: riderError } = await supabase
        .from('riders')
        .update({
          title,
          is_template,
          stage_plot_id,
          setlist_id,
          gig_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', riderId)

      if (riderError) throw riderError
    }

    // Delete existing sections
    const { error: deleteError } = await supabase
      .from('rider_section_content')
      .delete()
      .eq('rider_id', riderId)

    if (deleteError) throw deleteError

    // Create new sections
    if (sections.length > 0) {
      const { error: sectionsError } = await supabase
        .from('rider_section_content')
        .insert(
          sections.map(section => ({
            rider_id: riderId,
            section_id: section.section_id,
            custom_section_name: section.custom_section_name,
            content: section.content,
            sort_order: section.sort_order,
          }))
        )

      if (sectionsError) throw sectionsError
    }

    revalidatePath('/riders')
    return { success: true }
  } catch (error) {
    console.error('Error updating rider:', error)
    return { success: false, error }
  }
}

export async function deleteRider(riderId: string) {
  const cookieStore = cookies()
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('riders')
      .delete()
      .eq('id', riderId)

    if (error) throw error

    revalidatePath('/riders')
    return { success: true }
  } catch (error) {
    console.error('Error deleting rider:', error)
    return { success: false, error }
  }
}

export async function getStagePlots(userId: string) {
  const cookieStore = cookies()
  const supabase = createClient()

  const { data: stagePlots, error } = await supabase
    .from('stage_plots')
    .select('id, user_id, name, stage_width, stage_depth, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching stage plots:', error)
    throw error
  }

  return stagePlots
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
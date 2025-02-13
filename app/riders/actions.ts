'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Rider, TechnicalRiderDetails, HospitalityRiderDetails, RiderType, InputListRow } from './types'

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

  // Get the rider details
  const { data: details, error: detailsError } = await supabase
    .from(table)
    .select('*')
    .eq('rider_id', riderId)
    .maybeSingle()

  if (detailsError && detailsError.code !== 'PGRST116') {
    console.error(`Error fetching ${type} rider details:`, detailsError)
    throw detailsError
  }

  // For technical riders, also get the input list
  let inputList = []
  if (type === 'technical') {
    const { data: inputListData, error: inputListError } = await supabase
      .from('input_list')
      .select('*')
      .eq('rider_id', riderId)
      .order('channel_number', { ascending: true })

    if (inputListError) {
      console.error('Error fetching input list:', inputListError)
      throw inputListError
    }

    inputList = inputListData || []
    console.log('Fetched input list:', inputList) // Debug log
  }

  // If no details exist, return an empty object with the rider_id
  const baseDetails = details || { rider_id: riderId, sections: {} }

  // For technical riders, always include the input list
  if (type === 'technical') {
    return {
      ...baseDetails,
      input_list: inputList
    } as TechnicalRiderDetails
  }

  return baseDetails as HospitalityRiderDetails
}

interface CreateRiderData {
  type: RiderType
  title: string
  is_template: boolean
  stage_plot_id?: string
  setlist_id?: string
  gig_id?: string
  sections: {
    section_id: string
    custom_section_name: string | null
    content: Record<string, any>
    sort_order: number
  }[]
  input_list?: InputListRow[]
}

interface UpdateRiderData extends CreateRiderData {
  riderId: string
}

export async function createRider(data: CreateRiderData) {
  try {
    const cookieStore = cookies()
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw userError || new Error('User not found')

    // Start a transaction
    const { data: rider, error: riderError } = await supabase
      .from('riders')
      .insert({
        user_id: user.id,
        type: data.type,
        title: data.title,
        is_template: data.is_template,
        stage_plot_id: data.stage_plot_id,
        setlist_id: data.setlist_id,
        gig_id: data.gig_id
      })
      .select()
      .single()

    if (riderError) throw riderError

    // Insert sections
    if (data.sections.length > 0) {
      const { error: sectionsError } = await supabase
        .from('rider_section_content')
        .insert(
          data.sections.map(section => ({
            rider_id: rider.id,
            section_id: section.section_id,
            custom_section_name: section.custom_section_name,
            content: section.content,
            sort_order: section.sort_order
          }))
        )

      if (sectionsError) throw sectionsError
    }

    // Insert input list if provided and rider is technical
    if (data.type === 'technical' && data.input_list && data.input_list.length > 0) {
      const { error: inputListError } = await supabase
        .from('input_list')
        .insert(
          data.input_list.map(row => ({
            ...row,
            rider_id: rider.id
          }))
        )

      if (inputListError) throw inputListError
    }

    revalidatePath('/riders')
    return { success: true }
  } catch (error) {
    console.error('Error creating rider:', error)
    return { success: false, error }
  }
}

export async function updateRider(data: UpdateRiderData) {
  try {
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
        gig_id: data.gig_id
      })
      .eq('id', data.riderId)

    if (riderError) throw riderError

    // Delete existing sections
    const { error: deleteSectionsError } = await supabase
      .from('rider_section_content')
      .delete()
      .eq('rider_id', data.riderId)

    if (deleteSectionsError) throw deleteSectionsError

    // Insert new sections
    if (data.sections.length > 0) {
      const { error: sectionsError } = await supabase
        .from('rider_section_content')
        .insert(
          data.sections.map(section => ({
            rider_id: data.riderId,
            section_id: section.section_id,
            custom_section_name: section.custom_section_name,
            content: section.content,
            sort_order: section.sort_order
          }))
        )

      if (sectionsError) throw sectionsError
    }

    // Handle input list if this is a technical rider
    if (data.type === 'technical') {
      // Delete existing input list
      const { error: deleteInputListError } = await supabase
        .from('input_list')
        .delete()
        .eq('rider_id', data.riderId)

      if (deleteInputListError) throw deleteInputListError

      // Insert new input list if provided
      if (data.input_list && data.input_list.length > 0) {
        const { error: inputListError } = await supabase
          .from('input_list')
          .insert(
            data.input_list.map(row => ({
              ...row,
              rider_id: data.riderId
            }))
          )

        if (inputListError) throw inputListError
      }
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
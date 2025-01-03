import createClient from '@/utils/supabase/client'
import { StagePlot, StagePlotItem } from '../types'
import { Database } from '@/types/supabase'

const supabase = createClient()

export async function createStagePlot(
  name: string,
  stageWidth: number,
  stageDepth: number,
  items: Omit<StagePlotItem, 'id' | 'stage_plot_id' | 'created_at'>[]
): Promise<StagePlot | null> {
  // Get the current user's ID
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('Error getting user:', userError)
    return null
  }

  // Start a transaction by using single batch
  const { data: plot, error: plotError } = await supabase
    .from('stage_plots')
    .insert({
      name,
      stage_width: stageWidth,
      stage_depth: stageDepth,
      user_id: user.id
    })
    .select()
    .single()

  if (plotError || !plot) {
    console.error('Error creating stage plot:', plotError)
    return null
  }

  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from('stage_plot_items')
      .insert(
        items.map(item => ({
          ...item,
          stage_plot_id: plot.id,
          technical_requirements: item.technical_requirements || {}
        }))
      )

    if (itemsError) {
      console.error('Error creating stage plot items:', itemsError)
      // Consider rolling back the stage plot creation here
      await supabase.from('stage_plots').delete().eq('id', plot.id)
      return null
    }
  }

  return plot
}

export async function getStagePlot(id: string): Promise<{
  plot: StagePlot | null
  items: StagePlotItem[]
}> {
  const [plotResult, itemsResult] = await Promise.all([
    supabase
      .from('stage_plots')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('stage_plot_items')
      .select('*')
      .eq('stage_plot_id', id)
  ])

  if (plotResult.error) {
    console.error('Error fetching stage plot:', plotResult.error)
  }

  if (itemsResult.error) {
    console.error('Error fetching stage plot items:', itemsResult.error)
  }

  return {
    plot: plotResult.error ? null : plotResult.data,
    items: itemsResult.error ? [] : itemsResult.data
  }
}

export async function updateStagePlot(
  id: string,
  updates: Partial<Omit<StagePlot, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('stage_plots')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating stage plot:', error)
    return false
  }

  return true
}

export async function updateStagePlotItems(
  plotId: string,
  items: (Omit<StagePlotItem, 'created_at'> & { id?: string })[]
): Promise<boolean> {
  try {
    // First, delete all existing items
    const { error: deleteError } = await supabase
      .from('stage_plot_items')
      .delete()
      .eq('stage_plot_id', plotId)

    if (deleteError) {
      console.error('Error deleting existing items:', deleteError)
      return false
    }

    // Then insert all items as new
    if (items.length > 0) {
      const { error: insertError } = await supabase
        .from('stage_plot_items')
        .insert(
          items.map(({ id, ...item }) => ({
            ...item,
            stage_plot_id: plotId,
            technical_requirements: item.technical_requirements || {}
          }))
        )

      if (insertError) {
        console.error('Error inserting items:', insertError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error updating stage plot items:', error)
    return false
  }
}

export async function deleteStagePlot(id: string): Promise<boolean> {
  // Delete items first (they should cascade, but let's be explicit)
  const { error: itemsError } = await supabase
    .from('stage_plot_items')
    .delete()
    .eq('stage_plot_id', id)

  if (itemsError) {
    console.error('Error deleting stage plot items:', itemsError)
    return false
  }

  const { error } = await supabase
    .from('stage_plots')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting stage plot:', error)
    return false
  }

  return true
}

export async function listStagePlots(): Promise<StagePlot[]> {
  const { data, error } = await supabase
    .from('stage_plots')
    .select()
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error listing stage plots:', error)
    return []
  }

  return data
} 
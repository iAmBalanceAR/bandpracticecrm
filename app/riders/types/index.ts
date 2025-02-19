import { type } from "os"
import { StagePlot, StagePlotItem } from '@/app/stage-plot/types'

export type RiderType = 'technical' | 'hospitality'

export interface Rider {
  id: string
  user_id: string
  gig_id?: string
  type: RiderType
  title: string
  created_at: string
  updated_at: string
  version: number
  is_template: boolean
  stage_plot_id?: string
  setlist_id?: string
  rider_section_content?: RiderSectionContent[]
  sections?: {
    id: string
    name: string
    sort_order: number
    is_custom: boolean
    is_default: boolean
    content: Record<string, any>
  }[]
  details?: TechnicalRiderDetails | HospitalityRiderDetails
  stagePlot?: StagePlot
  stagePlotItems?: StagePlotItem[]
  setlist?: Setlist
  setlistItems?: SetlistItem[]
}

export interface RiderSection {
  id: string
  name: string
  description?: string
  is_default: boolean
  sort_order: number
}

export interface RiderSectionContent {
  id: string
  rider_id: string
  section_id: string | null
  custom_section_name?: string
  content: Record<string, any>
  sort_order: number
}

export interface TechnicalRiderDetails {
  id?: string
  rider_id: string
  pa_system: Record<string, any>
  mixing_console: Record<string, any>
  monitoring: Record<string, any>
  microphones: Record<string, any>
  backline: Record<string, any>
  lighting: Record<string, any>
  stage_requirements: Record<string, any>
  power_requirements: Record<string, any>
  additional_requirements: Record<string, any>
  sections?: Record<string, any>
  input_list?: InputListRow[]
}

export interface HospitalityRiderDetails {
  id?: string
  rider_id: string
  dressing_room: Record<string, any>
  catering: Record<string, any>
  beverages: Record<string, any>
  meals: Record<string, any>
  hotel: Record<string, any>
  transportation: Record<string, any>
  parking: Record<string, any>
  security: Record<string, any>
  merchandise: Record<string, any>
  additional_requirements: Record<string, any>
  sections?: Record<string, any>
}

export interface SetlistItem {
  id: string
  setlist_id: string
  title: string
  duration: string
  notes?: string
  sort_order: number
}

export interface Setlist {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  items?: SetlistItem[]
}

export interface RiderFormProps {
  type: RiderType
  initialData?: Rider
  isLoading?: boolean
  stagePlots: StagePlot[]
  setlists: Setlist[]
}

export interface RiderListProps {
  type: RiderType
  riders: Rider[]
  onSelect?: (rider: Rider) => void
  onDelete?: (rider: Rider) => Promise<void>
  onViewDetails?: (rider: Rider) => void
  isLoading?: boolean
}

export interface SectionSelectProps {
  type: RiderType
  selectedSections: Set<string>
  onSectionToggle: (sectionId: string) => void
  onCustomSectionAdd: (name: string) => void
  availableSections: RiderSection[]
}

export interface RiderSectionProps {
  section: RiderSection | { id: string; name: string; custom: true }
  content: string
  onContentChange: (content: string) => void
  onRemove: () => void
}

export interface InputListRow {
  id: string
  rider_id: string
  channel_number: number
  instrument: string
  microphone: string
  created_at?: string
  updated_at?: string
}

export interface InputListProps {
  riderId?: string
  initialRows?: InputListRow[]
  onRowsChange: (rows: InputListRow[]) => void
  readOnly?: boolean
}

export type { StagePlot }

export type ReportSectionType = 
  | 'financial'
  | 'schedule' 
  | 'venue'
  | 'leads'
  | 'technical'
  | 'map'
  | 'stage-plot'
  | 'contacts'
  | 'custom'

export interface ReportSection {
  id: string
  type: ReportSectionType
  title: string
  description?: string
  options?: Record<string, any>
}

export interface ReportTemplate {
  id: string
  name: string
  description?: string
  sections: ReportSection[]
  layout: 'single' | 'two-column' | 'grid'
  createdAt: Date
  updatedAt: Date
}

export interface ReportData {
  template: ReportTemplate
  data: Record<string, any>
  generatedAt: Date
}

export interface ReportOptions {
  includeHeader?: boolean
  includeFooter?: boolean
  pageSize?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface ReportSectionOptions {
  showTitle: boolean;
  layout: 'list';
  filters: string[];
} 
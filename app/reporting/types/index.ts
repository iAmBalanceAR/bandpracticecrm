export type DateRange = {
  start: Date;
  end: Date;
};

export type ReportSectionType = 
  | 'financial' 
  | 'schedule' 
  | 'technical' 
  | 'venue' 
  | 'leads' 
  | 'map' 
  | 'stage-plot'
  | 'contacts'
  | 'custom';

export type ReportFilter = {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
};

export type ReportSectionOptions = {
  showTitle: boolean;
  layout: 'list' | 'grid' | 'table';
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters: ReportFilter[];
  customCalculations?: {
    name: string;
    formula: string;
  }[];
};

export type ReportSection = {
  id: string;
  type: ReportSectionType;
  title: string;
  description?: string;
  options: ReportSectionOptions;
};

export type ReportTemplate = {
  id: string;
  name: string;
  description?: string;
  sections: ReportSection[];
  layout: 'single' | 'two-column' | 'grid';
  dateRange?: DateRange;
  filters?: ReportFilter[];
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean;
};

export type DataSourceConfig = {
  type: ReportSectionType;
  title: string;
  description: string;
  availableFields: string[];
  defaultOptions: Partial<ReportSectionOptions>;
  previewComponent: React.ComponentType<any>;
}; 
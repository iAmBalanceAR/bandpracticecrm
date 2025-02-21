# Band Practice - Reporting Feature Technical Specificatio

## Overview

The reporting feature is a flexible, modular system designed to allow users to generate customized PDF reports by combining different types of content sections. It lives in the `/app/reporting` directory and follows a self-contained architecture pattern.

## Architecture

### Directory Structure

```/app/reporting/
├── components/
│   ├── report-builder.tsx       # Main report configuration UI
│   ├── section-preview.tsx      # Preview components for each section type
│   └── available-sections.tsx   # List of available section types
├── types/
│   └── index.ts                # Type definitions for report sections
├── utils/
│   └── report-generator.ts      # PDF generation logic
└── page.tsx                    # Main reporting page component
```

### Core Components

#### ReportBuilder (`components/report-builder.tsx`)

- Primary component for report configuration
- Manages state for selected sections and report options
- Handles section addition/removal
- Triggers report generation
- Uses a single-column layout with sections:
  1. Available section selection
  2. Report preview
  3. Export controls

#### SectionPreview (`components/section-preview.tsx`)

- Renders preview cards for each section type
- Implements consistent styling:
  - Background: #192555
  - Borders: border-blue-500
  - Rounded corners
  - Consistent padding and spacing
- Supports 9 section types:
  1. Financial Summary
  2. Tour Schedule
  3. Venue Details
  4. Leads Overview
  5. Technical Requirements
  6. Route Map
  7. Stage Plot
  8. Contact Information
  9. Custom Section

### Data Models

#### Report Section Type (types/index.ts)

```typescript
interface ReportSection {
  id: string;
  type: 'financial' | 'schedule' | 'venue' | 'leads' | 'technical' | 
        'map' | 'stage-plot' | 'contacts' | 'custom';
  title: string;
  options: ReportSectionOptions;
}

interface ReportSectionOptions {
  showTitle: boolean;
  layout: 'single' | 'two-column';
  filters?: Record<string, any>;
}
```

### UI/UX Considerations

#### Layout & Styling

- Uses dark theme with consistent colors:
  - Main background: #111C44
  - Section backgrounds: #192555
  - Accent color: border-blue-500
- Responsive design with mobile-first approach
- Consistent spacing using TailwindCSS utilities
- Clear visual hierarchy with section headers and preview cards

#### User Flow

1. User lands on reporting page
2. Selects sections from available options
3. Previews section content in real-time
4. Configures section-specific options if available
5. Generates PDF report

### PDF Generation

#### Process

1. Collects selected sections and their configurations
2. Fetches required data for each section
3. Generates PDF using jsPDF
4. Handles section-specific rendering:
   - Financial data with charts
   - Schedule tables
   - Venue information cards
   - Maps and stage plots as images
   - Contact details in structured format

#### PDF Styling

- A4 format (210mm x 297mm)
- Proper margin handling
- Consistent typography
- Section breaks and page management
- Header/footer on each page

### Data Integration

#### Data Sources

- Tour information from tour management system
- Financial data from accounting system
- Venue details from venue management
- Lead information from CRM
- Technical requirements from stage management
- Map data from routing system

#### Data Flow

1. Section selection triggers data prefetch
2. Data is transformed into preview format
3. Same data is used for PDF generation
4. Caching implemented for performance

### Future Enhancements

#### Planned Features

1. Template saving and management
2. Custom section builder
3. Advanced filtering options
4. Batch report generation
5. Report scheduling
6. Export format options (beyond PDF)
7. Interactive elements in preview
8. Section reordering via drag-and-drop

#### Technical Debt & Improvements

1. Implement error boundaries for each section
2. Add loading states for data fetching
3. Improve PDF generation performance
4. Add unit tests for core components
5. Implement E2E tests for report generation
6. Add accessibility features
7. Implement proper type validation

### Integration Points

#### Required APIs

1. `/api/tours` - Tour data
2. `/api/venues` - Venue information
3. `/api/finances` - Financial data
4. `/api/leads` - Lead information
5. `/api/technical` - Technical requirements
6. `/api/contacts` - Contact details

#### External Dependencies

- jsPDF for PDF generation
- React-Query for data fetching
- Tailwind CSS for styling
- ShadcnUI for UI components
- Lucide icons for iconography

### Testing Strategy

#### Unit Tests

- Component rendering
- Section type handling
- Data transformation
- PDF generation utilities

#### Integration Tests

- Section selection flow
- Data fetching integration
- PDF generation process
- Error handling

#### E2E Tests

- Complete report generation flow
- PDF output validation
- UI interaction testing

### Performance Considerations

#### Optimizations

1. Lazy loading of preview components
2. Data caching strategy
3. PDF generation optimization
4. Image optimization for maps/plots
5. Debounced preview updates

#### Monitoring

- PDF generation time
- Data fetch latency
- Component render performance
- Memory usage during PDF creation

### Security Considerations

#### Data Access

- Proper authentication checks
- Role-based access control
- Data sanitization
- PDF content security

#### Input Validation

- Section configuration validation
- Data input sanitization
- File upload restrictions
- PDF size limits

### Deployment Considerations

#### Requirements

- Node.js 18+
- PDF generation dependencies
- Memory requirements for PDF processing
- Storage for temporary files

#### Configuration

- Environment variables for API endpoints
- PDF generation settings
- Cache configuration
- Storage paths

### Documentation

#### Developer Documentation

- Component API documentation
- Type definitions
- Integration guides
- Testing procedures

#### User Documentation

- Section type descriptions
- Configuration options
- Best practices
- Troubleshooting guide

## Recent Updates and Current State

### UI Components Current Implementation

- Report Builder (`app/reporting/components/report-builder.tsx`)
  - Main grid layout with Report Name, Total Sections, and Generate Report button
  - Available Sections grid (3 columns on large screens)
  - Each section card features:
    - Title with checkmark indicator when selected
    - Toggle button (Plus/Minus) for adding/removing
    - Preview content specific to section type
    - Selected state styling (green border, light green background)
  - Report Preview section showing selected sections in order

### Section Preview Component (`app/reporting/components/section-preview.tsx`)

- Renders different preview layouts based on section type:
  - Financial: Grid layout with revenue/expenses and chart placeholder
  - Schedule: List of venues and dates
  - Venue Details: Address and capacity information
  - Leads: Status and basic information
  - Technical Requirements: Bulleted list
  - Route Map: Map placeholder
  - Stage Plot: Stage plot placeholder
  - Contacts: Contact details
  - Custom: Generic content placeholder

### Visual States

- Card Selection:
  - Normal: Blue border (`border-blue-500`)
  - Selected: Green border (`border-green-500`), light green background (`bg-green-500/5`)
  - Checkmark indicator: Green background, white icon
- Toggle Buttons:
  - Add (Plus): Green icon
  - Remove (Minus): Red icon
  - Border colors match card state

### Current Layout Structure

```ReportBuilder
├── Header Metrics
│   ├── Report Name Input
│   ├── Total Sections Counter
│   └── Generate Report Button
├── Available Sections
│   └── Section Cards Grid
│       ├── Title with Checkmark
│       ├── Toggle Button
│       └── Section Preview
└── Report Preview
    └── Selected Sections List
        ├── Section Header
        ├── Remove Button
        └── Section Preview
```

### Pending Improvements

- Layout refinements for checkmark positioning
- Data integration for preview content
- PDF generation implementation
- Section reordering functionality
- Section-specific options and configurations

### Next Steps

- Implement data fetching for each section type
- Add section configuration options
- Build PDF generation with proper styling
- Add drag-and-drop reordering
- Implement section-specific filtering

## Conclusion

The reporting feature provides a flexible and extensible system for generating customized reports. Its modular architecture allows for easy additions and modifications while maintaining consistency in design and functionality. The system is designed to scale with additional section types and export options while maintaining performance and reliability.

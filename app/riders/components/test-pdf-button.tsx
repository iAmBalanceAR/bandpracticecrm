'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Document, Page, Text, View, StyleSheet, pdf, Font, Image } from '@react-pdf/renderer'
import { FeedbackModal } from '@/components/ui/feedback-modal'
import Html from 'react-pdf-html'
import { PageEmbeddingMismatchedContextError } from 'pdf-lib'
import { generateSetlistPDFInBrowser } from '@/app/setlist/utils/pdf-client'
import { PDFDocument } from 'pdf-lib'
import { getEquipmentById } from '@/app/stage-plot/utils/equipment'
import PDFGrid from '@/app/stage-plot/components/pdf-grid'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { createRoot } from 'react-dom/client'
import RiderPDFLoadingOverlay from './rider-pdf-loading-overlay'

// Simple, clean styles for our test PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f5f5f5',
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    width: 'auto',
    marginBottom: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
  },
  tableCell: {
    padding: 5,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: '#000',
  }
})

// Register the fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf', fontWeight: 'bold' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Oblique.ttf', fontStyle: 'italic' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-BoldOblique.ttf', fontWeight: 'bold', fontStyle: 'italic' }
  ]
})

// Custom stylesheet for HTML content
const htmlStyles = {
  'li > p': {
    marginTop: 0,
    paddingTop: 0,
    marginBottom: 8
  },
  ol: {
    paddingLeft: 6,
    marginBottom: 12,
  },
  ul: {
    paddingLeft: 6,
    marginBottom: 12,
  },
  li: {
    marginBottom: 8,
    paddingLeft: 6,
  },
  p: {
    marginBottom: 8,
  }
}

// Component for input list table
const InputListTable = ({ rows }: { rows?: any[] }) => {
  if (!rows || rows.length === 0) return null

  // Check if first row has any content in the relevant fields
  const isFirstRowEmpty = rows[0] && (
    !rows[0].channel_number && 
    !rows[0].instrument && 
    !rows[0].microphone
  )

  // If first row is empty and it's the only row, don't render the table
  if (isFirstRowEmpty && rows.length === 1) return null

  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, { width: '15%' }]}>Channel</Text>
        <Text style={[styles.tableCell, { width: '35%' }]}>Instrument</Text>
        <Text style={[styles.tableCell, { width: '50%' }]}>Microphone</Text>
      </View>
      {rows.map((row, index) => (
        <View key={row.id || index} style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: '15%' }]}>{row.channel_number}</Text>
          <Text style={[styles.tableCell, { width: '35%' }]}>{row.instrument}</Text>
          <Text style={[styles.tableCell, { width: '50%' }]}>{row.microphone}</Text>
        </View>
      ))}
    </View>
  )
}

// Helper function to format duration
const formatDuration = (duration: string) => {
  if (!duration) return '--:--'
  return duration
}

// Update the DateHeader component
const DateHeader = () => (
  <View style={{
    position: 'absolute',
    top: 10,
    right: 10,
    textAlign: 'right',
    backgroundColor: 'white',
    padding: '2mm',
  }}>
    <Text style={{
      fontSize: 8,
      color: '#888',
      fontFamily: 'Helvetica',
    }}>
      Generated: {new Date().toLocaleDateString()}
    </Text>
  </View>
)

// Add Footer component after DateHeader component
const Footer = () => (
  <View style={{
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    backgroundColor: 'white',
    padding: '2mm',
  }}>
    <Text style={{
      fontSize: 8,
      color: '#888',
      fontFamily: 'Helvetica',
      textAlign: 'center',
    }}>
      Created with Band Practice CRM® {new Date().getFullYear()}{'\n'}
      www.bandpracticecrm.com
    </Text>
  </View>
)

// Update SetlistPage to include Footer
const SetlistPage = ({ setlist, songs }: { setlist: any, songs: any[] }) => (
  <Page size="A4" style={styles.page}>
    <DateHeader />
    <View style={styles.header}>
      <Text style={styles.title}>Setlist: {setlist.title}</Text>
    </View>
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, { width: '10%' }]}>#</Text>
        <Text style={[styles.tableCell, { width: '50%' }]}>Song</Text>
        <Text style={[styles.tableCell, { width: '20%' }]}>Duration</Text>
        <Text style={[styles.tableCell, { width: '20%' }]}>Key</Text>
      </View>
      {songs.map((song, index) => (
        <View key={song.id} style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: '10%' }]}>{index + 1}</Text>
          <Text style={[styles.tableCell, { width: '50%' }]}>{song.title}</Text>
          <Text style={[styles.tableCell, { width: '20%' }]}>{song.duration || '--:--'}</Text>
          <Text style={[styles.tableCell, { width: '20%' }]}>{song.key}</Text>
        </View>
      ))}
    </View>
    {songs.some(song => song.notes) && (
      <View style={{ marginTop: 20 }}>
        <Text style={styles.sectionTitle}>Notes</Text>
        {songs.map((song, index) => song.notes && (
          <View key={song.id} style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 12, marginBottom: 4 }}>
              {index + 1}. {song.title}:
            </Text>
            <Text style={{ fontSize: 10, color: '#666', paddingLeft: 20 }}>
              {song.notes}
            </Text>
          </View>
        ))}
      </View>
    )}
    <Footer />
  </Page>
)

// Update StagePlotPage to include Footer
const StagePlotPage = ({ plot, items }: { plot: any, items: any[] }) => (
  <Page size="A4" style={styles.page}>
    <DateHeader />
    <View style={{
      height: '297mm',
      backgroundColor: 'white',
      padding: '0mm',
      position: 'relative',
    }}>
      {/* Title */}
      <View style={{
        textAlign: 'center',
        marginTop: '10mm',
        marginBottom: '5mm',
      }}>
        <Text style={{
          fontSize: 18,
          fontFamily: 'Helvetica-Bold',
          textDecoration: 'underline',
        }}>
          STAGE PLOT
        </Text>
        <Text style={{
          fontSize: 16,
          fontFamily: 'Helvetica',
        }}>
          {plot.name}
        </Text>
      </View>

      {/* Upstage label */}
      <View style={{
        backgroundColor: 'black',
        padding: '2mm',
        width: '125mm',
        margin: '0 auto',
      }}>
        <Text style={{
          color: 'white',
          fontFamily: 'Helvetica-Bold',
          fontSize: 14,
          textAlign: 'right',
        }}>
          UPSTAGE --&gt;
        </Text>
      </View>

      {/* Stage area */}
      <View style={{
        position: 'relative',
        height: '124mm',
        width: '210mm',
        border: 1,
        borderColor: 'black',
        backgroundColor: 'white',
        marginTop: '43mm',
        transform: 'rotate(90)',
      }}>
        {/* Grid lines */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.5,
        }}>
          {/* Vertical grid lines */}
          {Array.from({ length: 13 }).map((_, i) => (
            <View
              key={`v${i}`}
              style={{
                position: 'absolute',
                left: `${(i / 12) * 100}%`,
                top: 0,
                bottom: 0,
                width: 1,
                backgroundColor: 'rgb(148, 163, 184)',
              }}
            />
          ))}
          {/* Horizontal grid lines */}
          {Array.from({ length: 7 }).map((_, i) => (
            <View
              key={`h${i}`}
              style={{
                position: 'absolute',
                top: `${(i / 6) * 100}%`,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: 'rgb(148, 163, 184)',
              }}
            />
          ))}
        </View>

        {/* Stage items */}
        {items.map((item) => {
          const equipment = getEquipmentById(item.equipment_id)
          if (!equipment) return null

          return (
            <View
              key={item.id}
              style={{
                position: 'absolute',
                left: `${item.position_x}%`,
                top: `${item.position_y}%`,
                width: `${item.width}%`,
                height: `${item.height}%`,
                transform: `rotate(${item.rotation})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                src={equipment.svgFile}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
              {(item.showLabel ?? equipment.showLabel ?? true) && (
                <View style={{
                  position: 'absolute',
                  bottom: '-5mm',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#cccfff',
                  border: 1,
                  borderColor: '#ccc333',
                  padding: '1mm 2mm',
                  borderRadius: 1,
                }}>
                  <Text style={{
                    fontSize: 10,
                    fontFamily: 'Helvetica',
                  }}>
                    {item.customLabel || equipment.label}
                  </Text>
                </View>
              )}
            </View>
          )
        })}
      </View>

      <View style={{ height: '43mm' }} />

      {/* Downstage label */}
      <View style={{
        backgroundColor: 'black',
        padding: '2mm',
        width: '125mm',
        margin: '0 auto',
      }}>
        <Text style={{
          color: 'white',
          fontFamily: 'Helvetica-Bold',
          fontSize: 14,
        }}>
          &lt;-- DOWNSTAGE
        </Text>
      </View>
    </View>
    <Footer />
  </Page>
)

// Update TechnicalRequirementsPage to include Footer
const TechnicalRequirementsPage = ({ items }: { items: any[] }) => (
  <Page size="A4" style={styles.page}>
    <DateHeader />
    <View style={{
      padding: '20mm',
    }}>
      <Text style={{
        fontSize: 20,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'black',
        marginBottom: '10mm',
      }}>
        Technical Requirements
      </Text>
      
      {/* Split into two columns manually since columnCount isn't supported */}
      <View style={{
        flexDirection: 'row',
        gap: '10mm',
      }}>
        <View style={{ flex: 1 }}>
          {items.slice(0, Math.ceil(items.length / 2)).map((item) => {
            const equipment = getEquipmentById(item.equipment_id)
            if (!equipment) return null

            const hasRequirements = Object.entries(item.technical_requirements)
              .some(([_, values]) => Array.isArray(values) && values.length > 0)

            if (!hasRequirements) return null

            return (
              <View key={item.id} style={{
                marginBottom: '5mm',
              }}>
                <Text style={{
                  fontSize: 12,
                  fontFamily: 'Helvetica-Bold',
                  marginBottom: '2mm',
                  borderBottomWidth: 0.3,
                  borderBottomColor: 'black',
                  paddingBottom: '1mm',
                }}>
                  {equipment.label}
                </Text>
                {Object.entries(item.technical_requirements).map(([key, values]) => {
                  if (!Array.isArray(values) || values.length === 0) return null

                  return (
                    <View key={key} style={{
                      marginLeft: '5mm',
                      marginBottom: '1.5mm',
                    }}>
                      <Text style={{
                        fontSize: 9,
                        fontFamily: 'Helvetica',
                      }}>
                        • {key}: {values.join(', ')}
                      </Text>
                    </View>
                  )
                })}
              </View>
            )
          })}
        </View>
        <View style={{ flex: 1 }}>
          {items.slice(Math.ceil(items.length / 2)).map((item) => {
            const equipment = getEquipmentById(item.equipment_id)
            if (!equipment) return null

            const hasRequirements = Object.entries(item.technical_requirements)
              .some(([_, values]) => Array.isArray(values) && values.length > 0)

            if (!hasRequirements) return null

            return (
              <View key={item.id} style={{
                marginBottom: '5mm',
              }}>
                <Text style={{
                  fontSize: 12,
                  fontFamily: 'Helvetica-Bold',
                  marginBottom: '2mm',
                  borderBottomWidth: 0.3,
                  borderBottomColor: 'black',
                  paddingBottom: '1mm',
                }}>
                  {equipment.label}
                </Text>
                {Object.entries(item.technical_requirements).map(([key, values]) => {
                  if (!Array.isArray(values) || values.length === 0) return null

                  return (
                    <View key={key} style={{
                      marginLeft: '5mm',
                      marginBottom: '1.5mm',
                    }}>
                      <Text style={{
                        fontSize: 9,
                        fontFamily: 'Helvetica',
                      }}>
                        • {key}: {values.join(', ')}
                      </Text>
                    </View>
                  )
                })}
              </View>
            )
          })}
        </View>
      </View>
    </View>
    <Footer />
  </Page>
)

interface TestPDFButtonProps {
  riderId: string
  title: string
}

// Update SimplePDFTemplate pages to include Footer
const SimplePDFTemplate = ({ rider, inputList, gig, setlist, setlistSongs }: { 
  rider: any, 
  inputList?: any[], 
  gig?: any, 
  setlist?: any, 
  setlistSongs?: any[]
}) => (
  <Document>
    {gig && (
      <Page size="A4" style={styles.page}>
        <DateHeader />
        <View style={[styles.header, { alignItems: 'center' }]}>
          <Text style={[styles.title, { textAlign: 'center', fontSize: 28, marginBottom: 10 }]}>
            {gig.tour_title || rider.title}
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
            Event Date: {new Date(gig.gig_date).toLocaleDateString()}
          </Text>
        </View>
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Venue</Text>
          <Text style={{ fontSize: 12, marginBottom: 4 }}>{gig.venue}</Text>
          <Text style={{ fontSize: 10, color: '#666' }}>{gig.venue_address}</Text>
          <Text style={{ fontSize: 10, color: '#666' }}>{gig.venue_city}, {gig.venue_state} {gig.venue_zip}</Text>
        </View>
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Schedule</Text>
          <View style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ fontSize: 10, width: 100 }}>Load In:</Text>
              <Text style={{ fontSize: 10 }}>{new Date(`2000-01-01 ${gig.load_in_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginLeft: 20, marginBottom: 1 }}>
              <Text style={{ fontSize: 10, width: 100 }}>-- Crew In:</Text>
              <Text style={{ fontSize: 10 }}>{gig.crew_hands_in ? 'Yes' : 'No'}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginLeft: 20 }}>
              <Text style={{ fontSize: 10, width: 100 }}>-- Crew Out:</Text>
              <Text style={{ fontSize: 10 }}>{gig.crew_hands_out ? 'Yes' : 'No'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={{ fontSize: 10, width: 100 }}>Sound Check:</Text>
            <Text style={{ fontSize: 10 }}>{new Date(`2000-01-01 ${gig.sound_check_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={{ fontSize: 10, width: 100 }}>Set Time:</Text>
            <Text style={{ fontSize: 10 }}>{new Date(`2000-01-01 ${gig.set_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginLeft: 20, marginBottom: 4 }}>
            <Text style={{ fontSize: 10, width: 100 }}>-- Set Length:</Text>
            <Text style={{ fontSize: 10 }}>{gig.set_length ? `${gig.set_length} hours` : 'Not specified'}</Text>
          </View>
        </View>
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Contact</Text>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={{ fontSize: 10, width: 100 }}>Name:</Text>
            <Text style={{ fontSize: 10 }}>{gig.contact_name}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={{ fontSize: 10, width: 100 }}>Phone:</Text>
            <Text style={{ fontSize: 10 }}>{gig.contact_phone}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={{ fontSize: 10, width: 100 }}>Email:</Text>
            <Text style={{ fontSize: 10 }}>{gig.contact_email}</Text>
          </View>
        </View>
        <Footer />
      </Page>
    )}
    {inputList && inputList.length > 0 && (
      <Page size="A4" style={styles.page}>
        <DateHeader />
        <View style={styles.header}>
          <Text style={styles.title}>Input List</Text>
        </View>
        <InputListTable rows={inputList} />
        <Footer />
      </Page>
    )}
    <Page size="A4" style={styles.page}>
      <DateHeader />
      <View style={styles.header}>
        <Text style={styles.title}>{rider.title}</Text>
      </View>
      {rider.sections?.map((section: any, index: number) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.name}</Text>
          <Html 
            stylesheet={htmlStyles}
            style={{ 
              fontSize: 12, 
              lineHeight: 1.6, 
              fontFamily: 'Helvetica'
            }}
          >
            {section.content}
          </Html>
        </View>
      ))}
      <Footer />
    </Page>
    {setlist && setlistSongs && (
      <SetlistPage setlist={setlist} songs={setlistSongs} />
    )}
  </Document>
)

export function TestPDFButton({ riderId, title }: TestPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [hasGig, setHasGig] = useState(false)
  const [hasInputList, setHasInputList] = useState(false)
  const [hasStagePlot, setHasStagePlot] = useState(false)
  const [hasSetlist, setHasSetlist] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'warning'
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  })
  const supabase = createClient()

  const handleTestExport = async () => {
    try {
      setIsGenerating(true)
      setShowLoadingOverlay(true)
      setIsCompleted(false)
      
      // Fetch rider data with sections
      const { data: rider, error: riderError } = await supabase
        .from('riders')
        .select(`
          id,
          title,
          type,
          gig_id,
          setlist_id,
          stage_plot_id,
          rider_section_content (
            id,
            section_id,
            custom_section_name,
            content,
            sort_order
          )
        `)
        .eq('id', riderId)
        .single()

      if (riderError || !rider) {
        throw new Error('Failed to fetch rider data')
      }

      // Set flags for loading overlay based on rider data
      setHasGig(!!rider.gig_id)
      setHasInputList(rider.type === 'technical')
      setHasStagePlot(!!rider.stage_plot_id)
      setHasSetlist(!!rider.setlist_id)

      // Fetch section names
      const sectionIds = rider.rider_section_content
        ?.filter((section: any) => section.section_id)
        .map((section: any) => section.section_id) || []

      let sectionNames: Record<string, string> = {}
      if (sectionIds.length > 0) {
        const { data: sections } = await supabase
          .from(rider.type === 'technical' ? 'technical_rider_sections' : 'hospitality_rider_sections')
          .select('id, name')
          .in('id', sectionIds)

        sectionNames = (sections || []).reduce((acc: Record<string, string>, section: any) => ({
          ...acc,
          [section.id]: section.name
        }), {})
      }

      // For technical riders, get the input list
      let inputList = []
      if (rider.type === 'technical') {
        const { data: inputListData, error: inputListError } = await supabase
          .from('input_list')
          .select('*')
          .eq('rider_id', riderId)
          .order('channel_number', { ascending: true })

        if (!inputListError) {
          inputList = inputListData || []
        }
      }

      // Transform sections with proper names but keep HTML content intact
      const transformedSections = rider.rider_section_content?.map((section: any) => {
        const isCustomSection = !section.section_id || section.section_id === '00000000-0000-0000-0000-000000000000'
        return {
          id: section.id,
          name: isCustomSection ? (section.custom_section_name || 'Untitled Section') : (sectionNames[section.section_id || ''] || 'Untitled Section'),
          content: section.content, // Keep HTML content intact
          sort_order: section.sort_order
        }
      }).sort((a: any, b: any) => a.sort_order - b.sort_order) || []

      if (!transformedSections || transformedSections.length === 0) {
        throw new Error('No content found in rider')
      }

      // Fetch gig data only if gig_id exists
      let gig = null
      if (rider.gig_id) {
        // First get the gig data
        const { data: gigData, error: gigError } = await supabase
          .from('gigs')
          .select('*')
          .eq('id', rider.gig_id)
          .single()

        if (gigError) {
          console.error('Failed to fetch gig data:', gigError)
        } else {
          gig = gigData

          // Then get the tour data if it exists
          const { data: tourConnectData } = await supabase
            .from('tourconnect')
            .select('tour_id')
            .eq('gig_id', rider.gig_id)
            .single()

          if (tourConnectData?.tour_id) {
            const { data: tourData } = await supabase
              .from('tours')
              .select('title')
              .eq('id', tourConnectData.tour_id)
              .single()

            if (tourData) {
              gig.tour_title = tourData.title
            }
          }
        }
      }

      // Fetch setlist data
      let setlist = null
      let setlistSongs = []
      if (rider.setlist_id) {
        const { data: setlistData, error: setlistError } = await supabase
          .from('setlists')
          .select('*')
          .eq('id', rider.setlist_id)
          .single()

        if (setlistError) {
          console.error('Failed to fetch setlist data:', setlistError)
        } else {
          setlist = setlistData
        }

        const { data: songsData, error: songsError } = await supabase
          .from('setlist_songs')
          .select('*')
          .eq('setlist_id', rider.setlist_id)
          .order('sort_order', { ascending: true })

        if (songsError) {
          console.error('Failed to fetch setlist songs:', songsError)
        } else {
          setlistSongs = songsData || []
        }
      }

      // Generate the main PDF with react-pdf (without stage plot)
      const mainPdfDoc = await pdf(<SimplePDFTemplate 
        rider={{ ...rider, sections: transformedSections }} 
        inputList={inputList}
        gig={gig}
        setlist={setlist}
        setlistSongs={setlistSongs}
      />).toBlob()

      // If we have stage plot data, create and merge it separately
      let finalPdfDoc = mainPdfDoc
      if (rider.stage_plot_id) {
        const { data: stagePlotData, error: stagePlotError } = await supabase
          .from('stage_plots')
          .select('*')
          .eq('id', rider.stage_plot_id)
          .single()

        if (stagePlotError) {
          console.error('Failed to fetch stage plot data:', stagePlotError)
        } else {
          const { data: stagePlotItemsData, error: stagePlotItemsError } = await supabase
            .from('stage_plot_items')
            .select('*')
            .eq('stage_plot_id', rider.stage_plot_id)

          if (stagePlotItemsError) {
            console.error('Failed to fetch stage plot items:', stagePlotItemsError)
          } else {
            const stagePlotItems = stagePlotItemsData || []
            const { data: stagePlotData } = await supabase
              .from('stage_plots')
              .select('*')
              .eq('id', rider.stage_plot_id)
              .single()

            if (stagePlotData) {
              const pdfDoc = await PDFDocument.load(await mainPdfDoc.arrayBuffer())
              const stagePlotPdf = new jsPDF({
                orientation: 'portrait',
                format: 'a4',
                unit: 'mm'
              })

              // Create a temporary container for stage plot rendering
              const container = document.createElement('div')
              container.style.position = 'fixed'
              container.style.top = '-9999px'
              container.style.left = '0'
              container.style.width = '210mm'
              container.style.height = '297mm'
              container.style.backgroundColor = 'white'
              document.body.appendChild(container)

              // Render the PDFGrid component
              const root = document.createElement('div')
              root.id = 'pdf-preview'
              container.appendChild(root)

              // Use ReactDOM to render
              const reactRoot = createRoot(root)
              reactRoot.render(<PDFGrid items={stagePlotItems} plotName={stagePlotData.name} />)

              // Wait for SVGs to load
              await new Promise(resolve => setTimeout(resolve, 500))

              try {
                // Capture the plot page
                const plotElement = document.getElementById('pdf-stage-grid-plot')
                const techElement = document.getElementById('pdf-stage-grid-tech')
                
                if (plotElement) {
                  const plotCanvas = await html2canvas(plotElement, {
                    scale: 2,
                    logging: false,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: 'white',
                    imageTimeout: 0,
                    onclone: (clonedDoc) => {
                      const svgs = Array.from(clonedDoc.getElementsByTagName('svg'))
                      svgs.forEach(svg => {
                        svg.setAttribute('width', '100%')
                        svg.setAttribute('height', '100%')
                        svg.style.width = '100%'
                        svg.style.height = '100%'
                        // Convert SVGs to grayscale
                        svg.style.filter = 'grayscale(100%)'
                      })
                    }
                  })

                  // Convert canvas to grayscale
                  const ctx = plotCanvas.getContext('2d')
                  if (ctx) {
                    const imageData = ctx.getImageData(0, 0, plotCanvas.width, plotCanvas.height)
                    const data = imageData.data
                    for (let i = 0; i < data.length; i += 4) {
                      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
                      data[i] = avg     // red
                      data[i + 1] = avg // green
                      data[i + 2] = avg // blue
                    }
                    ctx.putImageData(imageData, 0, 0)
                  }

                  // Add plot page with compression and grayscale
                  stagePlotPdf.addImage(
                    plotCanvas.toDataURL('image/png', 0.8),
                    'PNG',
                    0,
                    0,
                    210,
                    297,
                    undefined,
                    'FAST'
                  )
                }

                // Capture the technical requirements page
                if (techElement) {
                  const techCanvas = await html2canvas(techElement, {
                    scale: 2,
                    logging: false,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: 'white',
                    imageTimeout: 0,
                    onclone: (clonedDoc) => {
                      const svgs = Array.from(clonedDoc.getElementsByTagName('svg'))
                      svgs.forEach(svg => {
                        svg.setAttribute('width', '100%')
                        svg.setAttribute('height', '100%')
                        svg.style.width = '100%'
                        svg.style.height = '100%'
                        // Convert SVGs to grayscale
                        svg.style.filter = 'grayscale(100%)'
                      })
                    }
                  })

                  // Convert canvas to grayscale
                  const ctx = techCanvas.getContext('2d')
                  if (ctx) {
                    const imageData = ctx.getImageData(0, 0, techCanvas.width, techCanvas.height)
                    const data = imageData.data
                    for (let i = 0; i < data.length; i += 4) {
                      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
                      data[i] = avg     // red
                      data[i + 1] = avg // green
                      data[i + 2] = avg // blue
                    }
                    ctx.putImageData(imageData, 0, 0)
                  }

                  // Add tech page with compression and grayscale
                  stagePlotPdf.addPage()
                  stagePlotPdf.addImage(
                    techCanvas.toDataURL('image/png', 0.8),
                    'PNG',
                    0,
                    0,
                    210,
                    297,
                    undefined,
                    'FAST'
                  )
                }
              } finally {
                // Clean up
                reactRoot.unmount()
                document.body.removeChild(container)
              }

              // Convert to PDF document
              const stagePlotPdfBytes = await stagePlotPdf.output('arraybuffer')
              const stagePlotPdfDoc = await PDFDocument.load(stagePlotPdfBytes)
              
              // Copy all stage plot pages
              const copiedPages = await pdfDoc.copyPages(stagePlotPdfDoc, stagePlotPdfDoc.getPageIndices())
              
              // Insert after first page (or at start if no gig details)
              const insertIndex = gig ? 1 : 0
              copiedPages.forEach((page, index) => {
                pdfDoc.insertPage(insertIndex + index, page)
              })
              
              // Save the merged PDF
              const mergedPdfBytes = await pdfDoc.save()
              finalPdfDoc = new Blob([mergedPdfBytes], { type: 'application/pdf' })
            }
          }
        }
      }

      // When PDF is ready to download
      const url = URL.createObjectURL(finalPdfDoc)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-test.pdf`
      
      // Set completed state before triggering download
      setIsCompleted(true)
      
      // Small delay before showing success message and downloading
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: 'Your rider PDF has been generated and downloaded.',
        type: 'success'
      })

    } catch (error) {
      console.error('Error in test export:', error)
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'An error occurred while generating the PDF',
        type: 'error'
      })
    } finally {
      // Hide overlay only after feedback modal is shown
      setTimeout(() => {
        setShowLoadingOverlay(false)
        setIsGenerating(false)
        setIsCompleted(false)
      }, 500)
    }
  }

  return (
    <>
      <Button
        onClick={handleTestExport}
        disabled={isGenerating}
        variant="ghost"
        className="flex gap-2 text-white hover:text-white bg-green-600 hover:bg-green-700 border-black border"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        {isGenerating ? 'Building PDF...' : 'Export Rider As PDF'}
      </Button>

      {showLoadingOverlay && (
        <RiderPDFLoadingOverlay
          onComplete={() => setShowLoadingOverlay(false)}
          hasGig={hasGig}
          hasInputList={hasInputList}
          hasStagePlot={hasStagePlot}
          hasSetlist={hasSetlist}
          isCompleted={isCompleted}
        />
      )}

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
      />
    </>
  )
} 
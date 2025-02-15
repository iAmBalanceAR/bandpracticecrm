'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { generateStagePlotPDFInBrowser } from '@/app/stage-plot/utils/pdf-client'
import { generateSetlistPDFInBrowser } from '@/app/setlist/utils/pdf-client'
import { PDFDocument } from 'pdf-lib'
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer'
import { useToast } from '@/components/ui/use-toast'
import { FeedbackModal } from '@/components/ui/feedback-modal'
import JSZip from 'jszip'

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Inter'
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    padding: 5,
    backgroundColor: '#f0f0f0',
  },
  content: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 10,
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
  },
})

// Add these interfaces at the top of the file, after existing interfaces
interface RiderSection {
  id: string;
  section_id?: string;
  custom_section_name?: string;
  content: any;
  sort_order: number;
}

interface Section {
  id: string;
  name: string;
}

interface ExportRiderButtonProps {
  riderId: string
  title: string
}

interface ProcessedSection {
  id: string;
  name: string;
  content: {
    text: string;
  };
}

// Component for input list table
const InputListTable = ({ rows }: { rows?: any[] }) => {
  if (!rows || rows.length === 0) return null

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

// Function to safely process content
function processContent(content: any, name: string): { text: string; name: string } {
  console.log('Processing content:', {
    rawContent: content,
    rawContentType: typeof content,
    isNull: content === null,
    isUndefined: content === undefined,
    isObject: typeof content === 'object' && content !== null,
    hasTextProp: content && typeof content === 'object' && 'text' in content,
    hasContentProp: content && typeof content === 'object' && 'content' in content,
    name: name
  });

  try {
    // If content is null or undefined, return empty string but preserve name
    if (!content) {
      console.log('Content is null or undefined, returning empty string');
      return { text: '', name };
    }

    // If it's already a string, clean HTML
    if (typeof content === 'string') {
      console.log('Content is string, cleaning HTML');
      const div = document.createElement('div');
      div.innerHTML = content;
      const cleaned = (div.textContent || div.innerText || '').trim();
      console.log('Cleaned string content:', cleaned);
      return { text: cleaned, name };
    }

    // If it's a JSONB object with a specific structure we expect
    if (typeof content === 'object' && content !== null) {
      console.log('Content is object, checking for known properties');
      
      // If the object has a text or content property, use that
      if ('text' in content) {
        console.log('Found text property:', content.text);
        return { text: String(content.text), name };
      }
      if ('content' in content) {
        console.log('Found content property:', content.content);
        return { text: String(content.content), name };
      }
      
      // If it's an array, join the values
      if (Array.isArray(content)) {
        console.log('Content is array, joining values');
        return { text: content.map(item => String(item)).join('\n'), name };
      }
      
      // Otherwise, stringify the entire object but make it readable
      console.log('No known properties found, stringifying entire object');
      return { text: JSON.stringify(content, null, 2), name };
    }

    // For any other type, convert to string
    console.log('Converting other type to string:', String(content));
    return { text: String(content), name };
  } catch (error) {
    console.error('Error processing content:', error);
    return { text: '(Content processing error)', name };
  }
}

// Main PDF template component
const RiderPDFTemplate = ({ rider }: { rider: any }) => {
  console.log('Rendering PDF template with rider:', {
    id: rider.id,
    title: rider.title,
    type: rider.type,
    sectionsCount: rider.sections?.length || 0,
    sections: rider.sections?.map((s: ProcessedSection) => ({
      id: s.id,
      name: s.name,
      content: s.content,
      contentType: typeof s.content,
      contentIsNull: s.content === null,
      contentIsUndefined: s.content === undefined,
      contentLength: s.content?.text ? s.content.text.length : 0
    }))
  });

  // Split sections into chunks of 5
  const chunkSize = 5;
  const sectionChunks = [];
  for (let i = 0; i < (rider.sections?.length || 0); i += chunkSize) {
    sectionChunks.push(rider.sections.slice(i, i + chunkSize));
  }

  // Create a simple page if there are no sections
  if (!rider.sections || rider.sections.length === 0) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>{rider.title || 'Untitled Rider'}</Text>
            <Text style={styles.subtitle}>
              {(rider.type?.charAt(0).toUpperCase() + rider.type?.slice(1)) || ''} Rider
            </Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.content}>No content available</Text>
          </View>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{rider.title || 'Untitled Rider'}</Text>
          <Text style={styles.subtitle}>
            {(rider.type?.charAt(0).toUpperCase() + rider.type?.slice(1)) || ''} Rider
          </Text>
        </View>
      </Page>

      {sectionChunks.map((sections: any[], pageIndex: number) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {sections.map((section: any, index: number) => {
            try {
              console.log(`Processing section ${index + 1} in chunk ${pageIndex + 1}:`, {
                sectionId: section.id,
                sectionName: section.name,
                rawContent: section.content,
                contentType: typeof section.content,
                contentIsNull: section.content === null,
                contentIsUndefined: section.content === undefined,
                contentIsObject: typeof section.content === 'object' && section.content !== null,
                contentLength: section.content?.text ? section.content.text.length : 0
              });

              if (!section.content || !section.content.text) {
                console.warn(`Empty content in section ${index + 1} of chunk ${pageIndex + 1}`);
                return (
                  <View key={index} style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      {section.content?.name || section.name || `Section ${pageIndex * chunkSize + index + 1}`}
                    </Text>
                    <Text style={styles.content}>(No content available)</Text>
                  </View>
                );
              }

              // Truncate content if it's too long
              const maxLength = 5000;
              const truncatedContent = section.content.text.length > maxLength 
                ? section.content.text.substring(0, maxLength) + '...(content truncated)'
                : section.content.text;

              return (
                <View key={index} style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {section.content?.name || section.name || `Section ${pageIndex * chunkSize + index + 1}`}
                  </Text>
                  <Text style={styles.content}>{truncatedContent || '(No content available)'}</Text>
                </View>
              );
            } catch (error) {
              console.error(`Error rendering section ${pageIndex * chunkSize + index + 1}:`, error);
              return (
                <View key={index} style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {section.content?.name || section.name || `Section ${pageIndex * chunkSize + index + 1}`}
                  </Text>
                  <Text style={styles.content}>(Error rendering content)</Text>
                </View>
              );
            }
          })}
        </Page>
      ))}
    </Document>
  );
};

// Add this near the top of the file
const DOWNLOAD_EXPIRY_MINUTES = 10;

// Add this function before the ExportRiderButton component
async function generateInputListPDF(inputList: any[]): Promise<Uint8Array> {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Input List</Text>
        </View>
        <InputListTable rows={inputList} />
      </Page>
    </Document>
  );

  try {
    const pdfBlob = await pdf(doc).toBlob();
    const buffer = await pdfBlob.arrayBuffer();
    return new Uint8Array(buffer);
  } catch (error) {
    console.error('Error generating input list PDF:', error);
    throw new Error('Failed to generate input list PDF');
  }
}

export function ExportRiderButton({ riderId, title }: ExportRiderButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const supabase = createClient()
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  // Move Font registration to useEffect
  useEffect(() => {
    // Register fonts only on client side
    Font.register({
      family: 'Inter',
      src: 'https://rsms.me/inter/font-files/Inter-Regular.woff2'
    })

    Font.register({
      family: 'Inter',
      src: 'https://rsms.me/inter/font-files/Inter-Bold.woff2',
      fontWeight: 'bold'
    })
  }, [])

  const generateRiderPDF = async (rider: any): Promise<Uint8Array> => {
    console.log('Starting generateRiderPDF with full rider details:', {
      id: rider.id,
      title: rider.title,
      type: rider.type,
      sectionsCount: rider.sections?.length || 0,
      sectionsData: rider.sections?.map((section: { id: string; name: string; content: unknown }) => ({
        id: section.id,
        name: section.name,
        contentType: typeof section.content,
        contentLength: section.content ? JSON.stringify(section.content).length : 0
      }))
    });

    try {
      if (!rider) throw new Error('No rider data provided');
      if (!rider.sections) rider.sections = [];

      // Process and validate sections
      const validSections = rider.sections.map((section: any, index: number) => {
        try {
          const processedContent = processContent(section.content, section.name);
          if (!processedContent || Object.keys(processedContent).length === 0) {
            console.warn(`Empty content in section ${index}, using placeholder`);
            return {
              ...section,
              content: { text: '(No content provided)' }
            };
          }
          return {
            ...section,
            content: processedContent
          };
        } catch (error) {
          console.error(`Error processing section ${index}:`, error);
          return {
            ...section,
            content: { text: '(Content processing error)' }
          };
        }
      }).filter(Boolean);

      console.log('Valid sections after processing:', {
        count: validSections.length,
        sections: validSections.map((s: ProcessedSection) => ({
          id: s.id,
          name: s.name,
          contentLength: s.content.text.length
        }))
      });

      if (validSections.length === 0) {
        throw new Error('No valid sections found in the rider');
      }

      const processedRider = {
        ...rider,
        sections: validSections
      };

      // Generate PDF with error handling
      try {
        console.log('Creating PDF document...');
        const doc = <RiderPDFTemplate rider={processedRider} />;
        
        console.log('Generating PDF blob...');
        const pdfBlob = await pdf(doc).toBlob();
        
        console.log('PDF blob generated, size:', pdfBlob.size);
        
        // Validate PDF blob
        if (!pdfBlob || pdfBlob.size === 0) {
          throw new Error('Generated PDF is empty');
        }

        const buffer = await pdfBlob.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);

        // Validate PDF header
        const header = new TextDecoder().decode(uint8Array.slice(0, 5));
        if (!header.startsWith('%PDF-')) {
          throw new Error('Invalid PDF format');
        }

        console.log('PDF generation successful, size:', uint8Array.length);
        return uint8Array;
      } catch (error) {
        console.error('Error generating PDF document:', error);
        throw new Error(`Failed to generate PDF document: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error in generateRiderPDF:', error);
      throw new Error(`PDF Generation Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  const handleExport = async () => {
    try {
      setIsGenerating(true);
      setFeedbackModal({
        isOpen: true,
        title: "Generating Files",
        message: "Please wait while we generate your rider files...",
        type: "success"
      });

      const zip = new JSZip();
      const timestamp = new Date().getTime();
      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

      // Fetch rider data
      console.log('Fetching rider data for ID:', riderId)
      const { data: rider, error: riderError } = await supabase
        .from('riders')
        .select(`
          *,
          rider_section_content (
            id,
            section_id,
            custom_section_name,
            content,
            sort_order
          )
        `)
        .eq('id', riderId)
        .single();

      if (riderError || !rider) {
        throw new Error('Failed to fetch rider data');
      }

      // Fetch section names
      const sectionIds = rider.rider_section_content
        ?.filter((section: RiderSection) => section.section_id)
        .map((section: RiderSection) => section.section_id) || [];

      let sectionNames: Record<string, string> = {};
      if (sectionIds.length > 0) {
        const { data: sections } = await supabase
          .from(rider.type === 'technical' ? 'technical_rider_sections' : 'hospitality_rider_sections')
          .select('id, name')
          .in('id', sectionIds);

        console.log('Fetched section names:', {
          type: rider.type,
          sections: sections,
          sectionIds
        });

        sectionNames = (sections || []).reduce((acc: Record<string, string>, section: Section) => ({
          ...acc,
          [section.id]: section.name
        }), {});

        console.log('Section names lookup:', sectionNames);
      }

      // Transform sections with proper names
      const transformedSections = rider.rider_section_content?.map((section: RiderSection) => {
        const isCustomSection = !section.section_id || section.section_id === '00000000-0000-0000-0000-000000000000';
        return {
          id: section.id,
          name: isCustomSection ? (section.custom_section_name || 'Untitled Section') : (sectionNames[section.section_id || ''] || 'Untitled Section'),
          content: section.content,
          sort_order: section.sort_order,
          is_custom: isCustomSection,
          is_default: false
        };
      }).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order) || [];

      // Update the rider object with transformed sections
      const fullRider = {
        ...rider,
        sections: transformedSections
      };

      // 1. Generate Stage Plot PDF if it exists
      if (rider.stage_plot_id) {
        console.log('Generating stage plot PDF...');
        const [plotResult, itemsResult] = await Promise.all([
          supabase
            .from('stage_plots')
            .select('*')
            .eq('id', rider.stage_plot_id)
            .single(),
          supabase
            .from('stage_plot_items')
            .select('*')
            .eq('stage_plot_id', rider.stage_plot_id)
        ]);

        if (!plotResult.error && plotResult.data) {
          try {
            const stagePlotPDF = await generateStagePlotPDFInBrowser(
              plotResult.data,
              itemsResult.data || [],
              {
                includeGrid: true,
                includeTechRequirements: true
              }
            );
            zip.file(`${sanitizedTitle}_stageplot.pdf`, stagePlotPDF);
            console.log('Stage plot PDF generated and added to ZIP');
          } catch (error) {
            console.error('Error generating stage plot PDF:', error);
          }
        }
      }

      // 2. Generate Setlist PDF if it exists
      if (rider.setlist_id) {
        console.log('Generating setlist PDF...');
        const [setlistResult, songsResult] = await Promise.all([
          supabase
            .from('setlists')
            .select('*')
            .eq('id', rider.setlist_id)
            .single(),
          supabase
            .from('setlist_songs')
            .select('*')
            .eq('setlist_id', rider.setlist_id)
            .order('sort_order', { ascending: true })
        ]);

        if (!setlistResult.error && setlistResult.data) {
          try {
            const setlistPDF = await generateSetlistPDFInBrowser(
              setlistResult.data.title,
              songsResult.data || [],
              {
                includeNotes: true,
                includeKey: true
              }
            );
            zip.file(`${sanitizedTitle}_setlist.pdf`, setlistPDF);
            console.log('Setlist PDF generated and added to ZIP');
          } catch (error) {
            console.error('Error generating setlist PDF:', error);
          }
        }
      }

      // 3. Generate Input List PDF if it exists (for technical riders)
      if (rider.type === 'technical') {
        console.log('Generating input list PDF...');
        const { data: inputListData, error: inputListError } = await supabase
          .from('input_list')
          .select('*')
          .eq('rider_id', riderId)
          .order('channel_number', { ascending: true });

        if (!inputListError && inputListData && inputListData.length > 0) {
          try {
            const inputListPDF = await generateInputListPDF(inputListData);
            zip.file(`${sanitizedTitle}_inputlist.pdf`, inputListPDF);
            console.log('Input list PDF generated and added to ZIP');
          } catch (error) {
            console.error('Error generating input list PDF:', error);
          }
        }
      }

      // 4. Generate Main Rider PDF
      console.log('Generating main rider PDF...');
      try {
        const riderPDF = await generateRiderPDF(fullRider);
        zip.file(`${sanitizedTitle}_main.pdf`, riderPDF);
        console.log('Main rider PDF generated and added to ZIP');
      } catch (error) {
        console.error('Error generating main rider PDF:', error);
        throw new Error('Failed to generate main rider PDF');
      }

      // 5. Generate and upload ZIP file
      console.log('Generating ZIP file...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const filename = `${sanitizedTitle}_${timestamp}.zip`;
      const storagePath = `temp-riders/${rider.user_id}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('rider-pdfs')
        .upload(storagePath, zipBlob, {
          contentType: 'application/zip',
          cacheControl: '3600'
        });

      if (uploadError) {
        throw new Error('Failed to upload ZIP file');
      }

      // Get the download URL
      const { data: publicUrl } = supabase.storage
        .from('rider-pdfs')
        .getPublicUrl(storagePath);

      if (!publicUrl) {
        throw new Error('Failed to generate download link');
      }

      // Save export record
      const expiryTime = new Date(timestamp + (DOWNLOAD_EXPIRY_MINUTES * 60 * 1000));
      await supabase
        .from('rider_exports')
        .insert({
          rider_id: riderId,
          file_path: storagePath,
          file_name: filename,
          download_url: publicUrl.publicUrl,
          file_size: zipBlob.size,
          expires_at: expiryTime.toISOString(),
          is_temporary: true
        });

      // Schedule cleanup
      setTimeout(async () => {
        try {
          await supabase.storage.from('rider-pdfs').remove([storagePath]);
          await supabase
            .from('rider_exports')
            .update({ is_deleted: true })
            .eq('file_path', storagePath);
        } catch (error) {
          console.error('Error in cleanup process:', error);
        }
      }, DOWNLOAD_EXPIRY_MINUTES * 60 * 1000);

      // Show success message and open download link
      setFeedbackModal({
        isOpen: true,
        title: "Success",
        message: `Your rider files have been generated and will be available for ${DOWNLOAD_EXPIRY_MINUTES} minutes. Click the download button to get your files.`,
        type: "success"
      });

      window.open(publicUrl.publicUrl, '_blank');

    } catch (error: any) {
      console.error('Error in export process:', error);
      setFeedbackModal({
        isOpen: true,
        title: "Error",
        message: error.message || "An error occurred during export",
        type: "error"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleExport}
        disabled={isGenerating}
        variant="ghost"
        className="flex gap-2 text-white hover:text-white bg-green-600 hover:bg-green-700 border-black border"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        {isGenerating ? 'Generating...' : 'Export Files'}
      </Button>

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
      />
    </>
  );
}; 
import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import { PDFDocument } from 'pdf-lib';
import { Rider, InputListRow, TechnicalRiderDetails } from '../types';

// Register fonts if needed
Font.register({
  family: 'Inter',
  src: '/fonts/Inter-Regular.ttf',
});

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
});

// Component for input list table
const InputListTable = ({ rows }: { rows?: InputListRow[] }) => {
  if (!rows || rows.length === 0) return null;

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
  );
};

// Function to safely process content
function processContent(content: any, name: string): { text: string; name: string } {
  try {
    // If content is null or undefined, return empty string but preserve name
    if (!content) {
      return { text: '', name };
    }

    // If it's already a string, clean HTML and special characters
    if (typeof content === 'string') {
      const cleaned = content.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      return { text: cleaned, name };
    }

    // If it's a JSONB object with a specific structure we expect
    if (typeof content === 'object' && content !== null) {
      // If the object has a text or content property, use that
      if ('text' in content) {
        return { text: String(content.text), name };
      }
      if ('content' in content) {
        return { text: String(content.content), name };
      }
      
      // If it's an array, join the values
      if (Array.isArray(content)) {
        return { text: content.map(item => String(item)).join('\n'), name };
      }
      
      // Otherwise, stringify the entire object but make it readable
      return { text: JSON.stringify(content, null, 2), name };
    }

    // For any other type, convert to string
    return { text: String(content), name };
  } catch (error) {
    console.error('Error processing content:', error);
    return { text: '(Content could not be processed)', name };
  }
}

// Main PDF template component
const RiderPDFTemplate = ({ rider }: { rider: Rider }) => {
  if (!rider) {
    console.error('No rider data provided to PDF template');
    return null;
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

        {rider.sections?.map((section, index) => {
          // Process section content safely
          const processedContent = processContent(section.content, section.name);
          
          // Skip empty sections
          if (!processedContent) {
            console.warn(`Skipping empty section ${index}`);
            return null;
          }

          return (
            <View key={section.id || index} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {processedContent.name || section.name || `Section ${index + 1}`}
              </Text>
              <Text style={styles.content}>{processedContent.text || '(No content available)'}</Text>
            </View>
          );
        })}

        {rider.type === 'technical' && (rider.details as TechnicalRiderDetails)?.input_list && (
          <>
            <Text style={styles.sectionTitle}>Input List</Text>
            <InputListTable rows={(rider.details as TechnicalRiderDetails).input_list} />
          </>
        )}
      </Page>
    </Document>
  );
};

// Function to generate the main rider PDF
async function generateRiderPDF(rider: Rider): Promise<Uint8Array> {
  console.log('Starting PDF generation for rider:', rider.id);
  
  try {
    // Validate rider data
    if (!rider) {
      throw new Error('No rider data provided');
    }

    // Ensure sections exist
    if (!rider.sections) {
      rider.sections = [];
    }

    // Process and validate sections
    rider.sections = rider.sections.map((section, index) => {
      try {
        const processedContent = processContent(section.content, section.name);
        if (!processedContent || Object.keys(processedContent).length === 0) {
          console.warn(`Empty content in section ${index}, using placeholder`);
          return {
            ...section,
            content: { text: '(No content provided)', name: section.name }
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
          content: { text: '(Content processing error)', name: section.name }
        };
      }
    });

    console.log('Generating PDF document');
    const pdfDoc = await pdf(<RiderPDFTemplate rider={rider} />).toBlob();
    
    // Validate PDF size
    if (pdfDoc.size === 0) {
      throw new Error('Generated PDF is empty');
    }
    if (pdfDoc.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('Generated PDF exceeds size limit');
    }

    console.log('Converting PDF to buffer');
    const arrayBuffer = await pdfDoc.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Validate the buffer
    if (uint8Array.length === 0) {
      throw new Error('PDF buffer is empty');
    }

    // Check for PDF header
    const header = new TextDecoder().decode(uint8Array.slice(0, 5));
    if (header !== '%PDF-') {
      throw new Error('Invalid PDF format');
    }

    console.log('PDF generation successful, size:', uint8Array.length);
    return uint8Array;
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

// Function to merge PDFs with improved error handling
async function mergePDFs(pdfBuffers: Uint8Array[]): Promise<Uint8Array> {
  console.log('Starting PDF merge with', pdfBuffers.length, 'buffers');
  
  try {
    // Validate input buffers
    if (!pdfBuffers.length) {
      throw new Error('No PDF buffers provided for merging');
    }

    const mergedPdf = await PDFDocument.create();
    
    for (let i = 0; i < pdfBuffers.length; i++) {
      try {
        console.log(`Processing PDF ${i + 1}/${pdfBuffers.length}`);
        
        // Validate each buffer
        if (!pdfBuffers[i] || pdfBuffers[i].length === 0) {
          console.warn(`Skipping empty buffer at index ${i}`);
          continue;
        }

        const pdf = await PDFDocument.load(pdfBuffers[i], { 
          ignoreEncryption: true,
          throwOnInvalidObject: false
        });
        
        const pageIndices = pdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
        copiedPages.forEach(page => mergedPdf.addPage(page));
        
        console.log(`Added ${copiedPages.length} pages from PDF ${i + 1}`);
      } catch (error) {
        console.error(`Error processing PDF ${i + 1}:`, error);
        // Continue with next buffer instead of failing completely
        continue;
      }
    }

    // Ensure we have at least one page
    if (mergedPdf.getPageCount() === 0) {
      throw new Error('No valid pages found in any of the provided PDFs');
    }

    console.log('Saving merged PDF');
    return await mergedPdf.save();
  } catch (error: any) {
    console.error('Error in mergePDFs:', error);
    throw new Error(`Failed to merge PDFs: ${error.message}`);
  }
}

// Main export function with improved error handling
export async function exportRiderToPDF(
  rider: Rider,
  getStagePlotPDF?: (id: string) => Promise<Uint8Array>,
  getSetlistPDF?: (id: string) => Promise<Uint8Array>
): Promise<Uint8Array> {
  console.log('Starting rider export process');
  
  try {
    // Generate the main rider PDF
    console.log('Generating main rider PDF');
    const riderPDF = await generateRiderPDF(rider);
    
    // Collect all PDFs to merge
    const pdfsToMerge: Uint8Array[] = [riderPDF];
    
    // Add stage plot if it exists and we have the getter function
    if (rider.stage_plot_id && getStagePlotPDF) {
      try {
        console.log('Generating stage plot PDF');
        const stagePlotPDF = await getStagePlotPDF(rider.stage_plot_id);
        if (stagePlotPDF && stagePlotPDF.length > 0) {
          pdfsToMerge.push(stagePlotPDF);
        }
      } catch (error) {
        console.error('Error getting stage plot PDF:', error);
        // Continue without stage plot
      }
    }
    
    // Add setlist if it exists and we have the getter function
    if (rider.setlist_id && getSetlistPDF) {
      try {
        console.log('Generating setlist PDF');
        const setlistPDF = await getSetlistPDF(rider.setlist_id);
        if (setlistPDF && setlistPDF.length > 0) {
          pdfsToMerge.push(setlistPDF);
        }
      } catch (error) {
        console.error('Error getting setlist PDF:', error);
        // Continue without setlist
      }
    }
    
    // Merge all PDFs
    console.log('Merging PDFs');
    return await mergePDFs(pdfsToMerge);
  } catch (error: any) {
    console.error('Error in exportRiderToPDF:', error);
    throw new Error(`Failed to generate rider PDF: ${error.message}`);
  }
}
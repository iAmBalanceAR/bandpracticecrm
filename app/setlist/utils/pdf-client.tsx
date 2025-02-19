'use client'

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { createRoot } from 'react-dom/client'
import PDFGrid from '../components/pdf-grid'

interface Song {
  title: string
  duration: string
  notes: string
  sort_order: number
}

interface ExportOptions {
  includeNotes?: boolean
}

export async function generateSetlistPDFInBrowser(
  title: string,
  songs: Song[],
  options: ExportOptions = {}
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    // Create a temporary container for the PDF content
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.top = '-9999px'
    container.style.left = '0'
    container.style.width = '210mm'
    container.style.height = '297mm'
    container.style.backgroundColor = 'white'
    container.style.zIndex = '9999'

    // Create a white background container for the content
    const contentContainer = document.createElement('div')
    contentContainer.style.backgroundColor = 'white'
    contentContainer.style.margin = '0 auto'
    contentContainer.style.width = '210mm'
    container.appendChild(contentContainer)

    // Render the PDF content
    const root = document.createElement('div')
    root.id = 'pdf-setlist-content'
    contentContainer.appendChild(root)

    // Use ReactDOM to render the PDFGrid component
    const reactRoot = createRoot(root)
    reactRoot.render(
      <PDFGrid 
        title={title}
        songs={songs}
        includeNotes={options.includeNotes}
      />
    )

    // Add the container to the body
    document.body.appendChild(container)

    // Wait for React to render and then generate PDF
    setTimeout(async () => {
      try {
        // Create PDF with A4 dimensions in portrait
        const pdf = new jsPDF({
          orientation: 'portrait',
          format: 'a4',
          unit: 'mm'
        })

        // Get the rendered element
        const element = document.getElementById('pdf-setlist-content')
        if (!element) throw new Error('Setlist content element not found')

        // Capture the content exactly as rendered
        const canvas = await html2canvas(element, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white',
          imageTimeout: 0
        })

        // Add content to PDF
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 0.95),
          'JPEG',
          0,
          0,
          210,
          297
        )

        // Convert to Uint8Array
        const pdfOutput = pdf.output('arraybuffer')
        resolve(new Uint8Array(pdfOutput))
      } catch (error) {
        reject(error)
      } finally {
        document.body.removeChild(container)
      }
    }, 100)
  })
} 
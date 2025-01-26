"use client"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { createRoot } from 'react-dom/client'
import PDFGrid from '../components/pdf-grid'

interface Song {
  title: string
  duration: string
  key: string
  notes: string
  sort_order: number
}

interface ExportOptions {
  includeNotes?: boolean
  includeKey?: boolean
}

export async function generateSetlistPDF(
  title: string,
  songs: Song[],
  options: ExportOptions = {}
) {
  // Create a temporary container for the PDF content
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '-9999px'  // Move off screen
  container.style.left = '0'
  container.style.width = '210mm'  // A4 width
  container.style.height = '297mm'  // A4 height
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
      includeKey={options.includeKey}
    />
  )

  // Add the container to the body
  document.body.appendChild(container)

  try {
    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 100))

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
      scale: 2, // Reduced but still sharp
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: 'white',
      imageTimeout: 0
    })

    // Add content to PDF - use exact A4 dimensions
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.95), // JPEG with slight compression
      'JPEG',
      0,
      0,
      210, // A4 width in mm
      297  // A4 height in mm
    )

    // Save the PDF
    pdf.save(`${title.toLowerCase().replace(/\s+/g, '-')}-setlist.pdf`)
  } finally {
    document.body.removeChild(container)
  }
} 

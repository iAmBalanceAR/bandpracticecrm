import { StagePlot, StagePlotItem } from '../types'
import PDFGrid from '../components/pdf-grid'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ExportOptions {
  includeGrid?: boolean
  includeTechRequirements?: boolean
}

export async function generateStagePlotPDF(
  plot: StagePlot,
  items: StagePlotItem[],
  options: ExportOptions = {}
) {
  // Create a temporary container for the PDF content
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '0'
  container.style.width = '100%'
  container.style.height = '100%'
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
  container.style.zIndex = '9999'
  container.style.padding = '20px'
  container.style.overflow = 'auto'

  // Add a close button that will generate PDF
  const closeButton = document.createElement('button')
  closeButton.textContent = 'Generate PDF'
  closeButton.style.position = 'fixed'
  closeButton.style.top = '20px'
  closeButton.style.right = '20px'
  closeButton.style.padding = '8px 16px'
  closeButton.style.backgroundColor = '#22c55e'
  closeButton.style.color = 'white'
  closeButton.style.border = 'none'
  closeButton.style.borderRadius = '4px'
  closeButton.style.cursor = 'pointer'
  closeButton.onclick = async () => {
    closeButton.disabled = true
    closeButton.textContent = 'Generating...'
    closeButton.style.backgroundColor = '#94a3b8'
    
    try {
      // Create PDF with A4 dimensions in landscape
      const pdf = new jsPDF({
        orientation: 'portrait',
        format: 'a4',
        unit: 'px'
      })

      // Get the actual rendered elements
      const plotElement = document.getElementById('pdf-stage-grid-plot')
      const techElement = document.getElementById('pdf-stage-grid-tech')
      
      if (!plotElement) throw new Error('Plot element not found')

      // Capture the plot page exactly as rendered
      const plotCanvas = await html2canvas(plotElement, {
        scale: 4,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // Ensure SVGs are properly rendered in the clone
          const svgs = Array.from(clonedDoc.getElementsByTagName('svg'))
          svgs.forEach(svg => {
            svg.setAttribute('width', '100%')
            svg.setAttribute('height', '100%')
            svg.style.width = '100%'
            svg.style.height = '100%'
          })
        }
      })

      // Add plot to first page
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      pdf.addImage(
        plotCanvas.toDataURL('image/png', 1.0),
        'PNG',
        0,
        0,
        pdfWidth,
        pdfHeight
      )

      // Add tech requirements if they exist
      if (techElement) {
        const techCanvas = await html2canvas(techElement, {
          scale: 4,
          logging: false,
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white',
          imageTimeout: 0
        })

        pdf.addPage()

        pdf.addImage(
          techCanvas.toDataURL('image/png', 1.0),
          'PNG',
          0,
          0,
          pdfWidth,
          pdfHeight
        )
      }

      // Save the PDF
      pdf.save(`${plot.name.toLowerCase().replace(/\s+/g, '-')}-stage-plot.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
      document.body.removeChild(container)
    }
  }
  container.appendChild(closeButton)

  // Create a white background container for the content
  const contentContainer = document.createElement('div')
  contentContainer.style.backgroundColor = 'white'
  contentContainer.style.margin = '0 auto'
  contentContainer.style.maxWidth = '1000px'
  container.appendChild(contentContainer)

  // Render the PDF content for preview
  const root = document.createElement('div')
  root.id = 'pdf-preview'
  contentContainer.appendChild(root)

  // Use ReactDOM to render the PDFGrid component
  const { createRoot } = await import('react-dom/client')
  const reactRoot = createRoot(root)
  reactRoot.render(<PDFGrid items={items} plotName={plot.name} />)

  // Add the container to the body
  document.body.appendChild(container)
} 
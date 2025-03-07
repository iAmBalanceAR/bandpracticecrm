import { StagePlot, StagePlotItem } from '../types'
import PDFGrid from '../components/pdf-grid'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { createRoot } from 'react-dom/client'
import PDFLoadingOverlay from '../components/pdf-loading-overlay'

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
  container.style.top = '-9999px'  // Move off screen instead of visible
  container.style.left = '0'
  container.style.width = '210mm'
  container.style.height = '297mm'
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
  container.style.zIndex = '9999'
  container.style.overflow = 'auto'

  // Create a white background container for the content
  const contentContainer = document.createElement('div')
  contentContainer.style.backgroundColor = 'white'
  contentContainer.style.margin = '0 auto'
  contentContainer.style.width = '210mm' // A4 width
  container.appendChild(contentContainer)

  // Render the PDF content for preview
  const root = document.createElement('div')
  root.id = 'pdf-preview'
  contentContainer.appendChild(root)

  // Use ReactDOM to render the PDFGrid component
  const reactRoot = createRoot(root)
  reactRoot.render(<PDFGrid items={items} plotName={plot.name} />)

  // Add the container to the body
  document.body.appendChild(container)

  // Create loading overlay
  const loadingContainer = document.createElement('div')
  document.body.appendChild(loadingContainer)
  const loadingRoot = createRoot(loadingContainer)

  // Render loading overlay and start PDF generation
  loadingRoot.render(
    <PDFLoadingOverlay 
      onComplete={async () => {
        try {
          // Create PDF with A4 dimensions in portrait, using millimeters
          const pdf = new jsPDF({
            orientation: 'portrait',
            format: 'a4',
            unit: 'mm'
          })

          // Get the actual rendered elements
          const plotElement = document.getElementById('pdf-stage-grid-plot')
          const techElement = document.getElementById('pdf-stage-grid-tech')
          
          if (!plotElement) throw new Error('Plot element not found')

          // Capture the plot page exactly as rendered
          const plotCanvas = await html2canvas(plotElement, {
            scale: 2, // Better quality while still maintaining reasonable file size
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: 'white',
            imageTimeout: 0,
            onclone: (clonedDoc) => {
              // Convert SVGs to grayscale
              const svgs = Array.from(clonedDoc.getElementsByTagName('svg'))
              svgs.forEach(svg => {
                svg.setAttribute('width', '100%')
                svg.setAttribute('height', '100%')
                svg.style.width = '100%'
                svg.style.height = '100%'
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

          // Add plot to first page with compression
          pdf.addImage(
            plotCanvas.toDataURL('image/png', 0.8), // Good balance of quality and compression
            'PNG',
            0,
            0,
            210,
            297,
            undefined,
            'FAST'
          )

          // Add tech requirements if they exist
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
                  svg.style.filter = 'grayscale(100%)'
                })
              }
            })

            // Convert canvas to grayscale
            const techCtx = techCanvas.getContext('2d')
            if (techCtx) {
              const imageData = techCtx.getImageData(0, 0, techCanvas.width, techCanvas.height)
              const data = imageData.data
              for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
                data[i] = avg     // red
                data[i + 1] = avg // green
                data[i + 2] = avg // blue
              }
              techCtx.putImageData(imageData, 0, 0)
            }

            pdf.addPage()
            pdf.addImage(
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

          // Save the PDF
          pdf.save(`${plot.name.toLowerCase().replace(/\s+/g, '-')}-stage-plot.pdf`)
        } catch (error) {
          console.error('Error generating PDF:', error)
          alert('Error generating PDF. Please try again.')
        } finally {
          loadingRoot.unmount()
          document.body.removeChild(loadingContainer)
          document.body.removeChild(container)
        }
      }} 
    />
  )
} 
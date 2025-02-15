'use client'

import PDFGrid from '../components/pdf-grid'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { createRoot } from 'react-dom/client'
import PDFLoadingOverlay from '../components/pdf-loading-overlay'
import { StagePlot, StagePlotItem } from '../types'

interface ExportOptions {
  includeGrid?: boolean
  includeTechRequirements?: boolean
}

export async function generateStagePlotPDFInBrowser(
  plot: StagePlot,
  items: StagePlotItem[],
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
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
    container.style.zIndex = '9999'
    container.style.overflow = 'auto'

    // Create a white background container for the content
    const contentContainer = document.createElement('div')
    contentContainer.style.backgroundColor = 'white'
    contentContainer.style.margin = '0 auto'
    contentContainer.style.width = '210mm'
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
            // Create PDF with A4 dimensions in portrait
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
            pdf.addImage(
              plotCanvas.toDataURL('image/png', 1.0),
              'PNG',
              0,
              0,
              210,
              297
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
                210,
                297
              )
            }

            // Convert to Uint8Array
            const pdfOutput = pdf.output('arraybuffer')
            resolve(new Uint8Array(pdfOutput))
          } catch (error) {
            reject(error)
          } finally {
            loadingRoot.unmount()
            document.body.removeChild(loadingContainer)
            document.body.removeChild(container)
          }
        }}
      />
    )
  })
} 
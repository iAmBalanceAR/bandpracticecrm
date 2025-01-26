import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { createRoot } from 'react-dom/client'
import PDFLoadingOverlay from '../pdf-loading-overlay'

interface Song {
  id: string
  title: string
  duration: string
  key: string
  notes: string
  sort_order: number
}

interface ExportOptions {
  includeNotes?: boolean
  includeDuration?: boolean
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
  container.style.top = '-9999px'
  container.style.left = '0'
  container.style.width = '210mm'
  container.style.height = '297mm'
  container.style.backgroundColor = 'white'
  container.style.padding = '20mm'
  container.style.fontFamily = 'Helvetica'

  // Create the content
  const content = document.createElement('div')
  content.id = 'pdf-setlist'
  content.innerHTML = `
    <h1 style="font-size: 24pt; margin-bottom: 20pt; color: #1a1a1a; text-align: center; font-weight: bold;">
      ${title}
    </h1>
    <div style="margin-top: 30pt;">
      ${songs.map((song, index) => `
        <div style="margin-bottom: 15pt; padding: 10pt; background-color: ${index % 2 === 0 ? '#f8f8f8' : 'white'};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center;">
              <span style="font-size: 14pt; font-weight: bold; margin-right: 10pt;">${index + 1}.</span>
              <span style="font-size: 14pt;">${song.title}</span>
            </div>
            <div style="display: flex; gap: 20pt;">
              ${options.includeKey ? `<span style="font-size: 12pt; color: #666;">Key: ${song.key}</span>` : ''}
              ${options.includeDuration ? `<span style="font-size: 12pt; color: #666;">${song.duration}</span>` : ''}
            </div>
          </div>
          ${options.includeNotes && song.notes ? `
            <div style="margin-top: 5pt; font-size: 11pt; color: #666; padding-left: 25pt;">
              ${song.notes}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `

  container.appendChild(content)
  document.body.appendChild(container)

  // Create loading overlay
  const loadingContainer = document.createElement('div')
  document.body.appendChild(loadingContainer)
  const loadingRoot = createRoot(loadingContainer)

  return new Promise<void>((resolve, reject) => {
    loadingRoot.render(
      <PDFLoadingOverlay 
        onComplete={async () => {
          try {
            const pdf = new jsPDF({
              orientation: 'portrait',
              format: 'a4',
              unit: 'mm'
            })

            const element = document.getElementById('pdf-setlist')
            if (!element) throw new Error('Setlist element not found')

            const canvas = await html2canvas(element, {
              scale: 4,
              logging: false,
              useCORS: true,
              allowTaint: true,
              backgroundColor: 'white'
            })

            pdf.addImage(
              canvas.toDataURL('image/png', 1.0),
              'PNG',
              0,
              0,
              210,
              297
            )

            pdf.save(`${title.toLowerCase().replace(/\s+/g, '-')}-setlist.pdf`)
            resolve()
          } catch (error) {
            reject(error)
          } finally {
            document.body.removeChild(container)
            document.body.removeChild(loadingContainer)
          }
        }}
      />
    )
  })
} 
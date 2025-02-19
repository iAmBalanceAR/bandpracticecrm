"use client"
import React from 'react'

interface Song {
  title: string
  duration: string
  notes: string
  sort_order: number
}

interface PDFGridProps {
  title: string
  songs: Song[]
  includeNotes?: boolean
}

// PDF-specific styles
const pdfStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '210mm', // A4 width
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
    position: 'relative' as const,
  },
  page: {
    height: '297mm', // A4 height
    background: 'white',
    padding: '20mm',
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '15mm',
  },
  title: {
    fontSize: '28pt',
    fontWeight: 'bold',
    marginBottom: '5mm',
  },
  songList: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  songRow: {
    borderBottom: '1px solid #ddd',
    height: '12mm', // Increased row height for better spacing
  },
  songCell: {
    padding: '4mm 2mm', // Increased padding
    fontSize: '14pt', // Increased font size
    verticalAlign: 'middle' as const,
  },
  headerCell: {
    padding: '4mm 2mm', // Increased padding
    fontSize: '16pt', // Increased font size
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
    textAlign: 'left' as const,
  },
  numberCell: {
    width: '40px',
    textAlign: 'right' as const,
    paddingRight: '4mm',
    color: '#666',
    fontSize: '12pt',
  },
  footer: {
    position: 'absolute' as const,
    bottom: '10mm',
    left: '20mm',
    right: '20mm',
    textAlign: 'center' as const,
    fontSize: '8pt',
    color: '#666',
    borderTop: '1px solid #ddd',
    paddingTop: '5mm',
  }
}

export default function PDFGrid({ title, songs, includeNotes = true }: PDFGridProps) {
  return (
    <div id="pdf-setlist-content" style={pdfStyles.container}>
      <div style={pdfStyles.page}>
        <div style={pdfStyles.header}>
          <div style={pdfStyles.title}>{title}</div>
        </div>

        <table style={pdfStyles.songList}>
          <thead>
            <tr>
              <th style={pdfStyles.numberCell}>#</th>
              <th style={pdfStyles.headerCell}>Song</th>
              <th style={pdfStyles.headerCell}>Duration</th>
              {includeNotes && <th style={pdfStyles.headerCell}>Notes</th>}
            </tr>
          </thead>
          <tbody>
            {songs.map((song, index) => (
              <tr key={index} style={pdfStyles.songRow}>
                <td style={pdfStyles.numberCell}>{index + 1}</td>
                <td style={pdfStyles.songCell}>{song.title}</td>
                <td style={pdfStyles.songCell}>{song.duration}</td>
                {includeNotes && <td style={pdfStyles.songCell}>{song.notes}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        <div style={pdfStyles.footer}>
          Generated by Band Practice CRM • www.bandpracticecrm.com • All rights reserved
        </div>
      </div>
    </div>
  )
} 
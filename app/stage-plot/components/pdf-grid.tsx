"use client"
import React from 'react'
import { StagePlotItem } from '../types'
import { getEquipmentById } from '../utils/equipment'
import { fontFamily } from 'html2canvas/dist/types/css/property-descriptors/font-family'
import { fontWeight } from 'html2canvas/dist/types/css/property-descriptors/font-weight'
import { textDecorationLine } from 'html2canvas/dist/types/css/property-descriptors/text-decoration-line'

interface PDFGridProps {
  items: StagePlotItem[]
  plotName: string
}

// PDF-specific styles
const pdfStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '210mm', // A4 width
    margin: '0 auto',
  },
  plotPage: {
    height: '297mm', // A4 height
    background: 'white',
    padding: '0mm',
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
  },
  title: {
    textAlign: 'center' as const,
    marginTop: '10mm',
    marginBottom: '5mm',
  },
  titleText: {
    fontSize: '18pt',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginBottom: '0mm',
    marginTop: '0mm',
    fontFamily: 'monospace',
  },
  subtitleText: {
    fontSize: '16pt',
    fontWeight: 'normal',
    fontFamily: 'monospace',
  },
  stageLabel: {
    backgroundColor: 'black',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14pt',
    padding: '2mm',
    width: '125mm',
    margin: '0mm auto',
  },
  stageArea: {
    position: 'relative' as const,
    height: '124mm',  // 9/16 of height
    width: '210mm',    // maximum width of usable space
    border: '0.5mm solid black',
    backgroundColor: 'white',
    marginTop: '43mm',
    transform: 'rotate(90deg)', // rotate and adjust position to center

    backgroundImage: 'linear-gradient(to right, rgb(148 163 184 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.5) 1px, transparent 1px)',
    backgroundSize: 'calc(100% / 12) calc(100% / 6)',
  },
  stageItem: {
    position: 'absolute' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',

  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const,
    backgroundColor: 'none',
    backgroundOpacity: '60%',
  },
  itemLabel: {
    position: 'absolute' as const,
    bottom: '-5mm',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#cccfff',
    border: '1px solid #ccc333',
    padding: '1mm 2mm',
    borderRadius: '1mm',
    fontSize: '10pt',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap' as const,
  },
  techPage: {
    minHeight: '297mm', // A4 height
    background: 'white',
    padding: '20mm',
  },
  techTitle: {
    fontSize: '20pt',
    fontWeight: 'bold',
    width: '100%',
    borderBottom: '0.5mm solid black',
    marginBottom: '10mm',
    textAlign: 'center' as const,
  },
  techContent: {
    columns: '2',
    columnGap: '10mm',
    fontSize: '9pt',
  },
  techItem: {
    marginBottom: '5mm',
    breakInside: 'avoid' as const,
  },
  techItemTitle: {
    fontSize: '12pt',
    fontWeight: 'bold',
    marginBottom: '2mm',
    borderBottom: '0.3mm solid black',
    paddingBottom: '1mm',
  },
  techItemDetail: {
    marginLeft: '5mm',
    marginBottom: '1.5mm',
  },
}

export default function PDFGrid({ items, plotName }: PDFGridProps) {
  return (
    <div style={pdfStyles.container}>
      {/* Page 1 - Stage Plot */}
      <div id="pdf-stage-grid-plot" style={pdfStyles.plotPage}>
        <div style={pdfStyles.title}>
          <div style={pdfStyles.titleText}>
            STAGE PLOT
          </div>
          <div style={pdfStyles.subtitleText}>
            {plotName}
          </div>
        </div>

        {/* Upstage label */}
        <div style={pdfStyles.stageLabel}>
          <div style={{float: 'right'}}>UPSTAGE --&gt;</div>
          <div style={{clear: 'both'}}></div>
        </div>

        {/* Stage area */}
        <div style={pdfStyles.stageArea}>
          {/* Stage items */}
          {items.map((item) => {
            const equipment = getEquipmentById(item.equipment_id);
            if (!equipment) return null;

            return (
              <div
                key={item.id}
                style={{
                  ...pdfStyles.stageItem,
                  left: `${item.position_x}%`,
                  top: `${item.position_y}%`,
                  width: `${item.width}%`,
                  height: `${item.height}%`,
                  transform: `rotate(${item.rotation}deg)`,
                }}
              >
                <img
                  src={equipment.svgFile}
                  alt={equipment.label}
                  style={pdfStyles.itemImage}
                />
                {(item.showLabel ?? equipment.showLabel ?? true) && (
                  <div style={pdfStyles.itemLabel}>
                    {item.customLabel || equipment.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{height: '43mm'}}></div>
        {/* Downstage label */}
        <div style={pdfStyles.stageLabel}>
         &lt;-- DOWNSTAGE
        </div>
      </div>

      <div style={{ pageBreakBefore: 'always' }} />

      {/* Page 2 - Technical Requirements */}
      <div id="pdf-stage-grid-tech" style={pdfStyles.techPage}>
        <div style={pdfStyles.techTitle}>
          Technical Requirements
        </div>
        
        <div style={pdfStyles.techContent}>
          {items.map((item) => {
            const equipment = getEquipmentById(item.equipment_id);
            if (!equipment) return null;

            const hasRequirements = Object.entries(item.technical_requirements)
              .some(([_, values]) => Array.isArray(values) && values.length > 0);

            if (!hasRequirements) return null;

            return (
              <div key={item.id} style={pdfStyles.techItem}>
                <div style={pdfStyles.techItemTitle}>
                  {equipment.label}
                </div>
                {Object.entries(item.technical_requirements).map(([key, values]) => {
                  if (!Array.isArray(values) || values.length === 0) return null;

                  return (
                    <div key={key} style={pdfStyles.techItemDetail}>
                      • {key}: {values.join(', ')}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
} 
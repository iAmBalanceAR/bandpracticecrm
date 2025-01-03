"use client"
import React from 'react'
import { StagePlotItem } from '../types'
import { getEquipmentById } from '../utils/equipment'

interface PDFGridProps {
  items: StagePlotItem[]
  plotName: string
}

export default function PDFGrid({ items, plotName }: PDFGridProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Page 1 - Stage Plot */}
      <div id="pdf-stage-grid-plot" style={{ 
        height: '700px',
        background: 'white',
        padding: '40px',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '10px'
          }}>
            STAGE PLOT
          </div>
          <div style={{
            fontSize: '24px'
          }}>
            {plotName}
          </div>
        </div>

        {/* Upstage label */}
        <div style={{
          textAlign: 'center',
          color: 'black',
          fontWeight: 'bold',
          fontSize: '16px',
          marginBottom: '10px'
        }}>
          UPSTAGE
        </div>

        {/* Stage area */}
        <div style={{ 
          position: 'relative',
          width: '100%',
          height: '275px',
          border: '1px solid black',
          backgroundColor: 'white',
          margin: '0 auto'
        }}>
          {/* Stage items */}
          {items.map((item) => {
            const equipment = getEquipmentById(item.equipment_id);
            if (!equipment) return null;

            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${item.position_x}%`,
                  top: `${item.position_y}%`,
                  width: `${item.width}%`,
                  height: `${item.height}%`,
                  backgroundColor: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img
                  src={equipment.svgFile}
                  alt={equipment.label}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'fill'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
                }}>
                  {equipment.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Downstage label */}
        <div style={{
          textAlign: 'center',
          color: 'black',
          fontWeight: 'bold',
          fontSize: '16px',
          marginTop: '10px'
        }}>
          DOWNSTAGE (AUDIENCE)
        </div>
      </div>

      <div style={{ pageBreakBefore: 'always' }} />

      {/* Page 2 - Technical Requirements */}
      <div id="pdf-stage-grid-tech" style={{ 
        minHeight: '700px',
        background: 'white',
        padding: '40px'
      }}>
        <div style={{ 
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          Technical Requirements
        </div>
        
        <div style={{
          columns: '2',
          columnGap: '40px',
          fontSize: '12px'
        }}>
          {items.map((item) => {
            const equipment = getEquipmentById(item.equipment_id);
            if (!equipment) return null;

            const hasRequirements = Object.entries(item.technical_requirements)
              .some(([_, values]) => Array.isArray(values) && values.length > 0);

            if (!hasRequirements) return null;

            return (
              <div key={item.id} style={{ 
                marginBottom: '20px',
                breakInside: 'avoid'
              }}>
                <div style={{ 
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  borderBottom: '1px solid black',
                  paddingBottom: '4px'
                }}>
                  {equipment.label}
                </div>
                {Object.entries(item.technical_requirements).map(([key, values]) => {
                  if (!Array.isArray(values) || values.length === 0) return null;

                  return (
                    <div key={key} style={{ 
                      marginLeft: '20px',
                      marginBottom: '6px'
                    }}>
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
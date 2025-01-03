"use client"
import React from 'react'
import { StagePlotItem, Position, Size } from '../types'
import { getEquipmentById } from '../utils/equipment'
import DraggableItem from './draggable-item'
import Image from 'next/image'

interface StageGridProps {
  items: StagePlotItem[]
  selectedItem: string | null
  onSelectItem: (id: string | null) => void
  onPositionChange: (id: string, position: Position) => void
  onSizeChange: (id: string, size: Size) => void
  onRotationChange: (id: string, rotation: number) => void
}

export default function StageGrid({
  items,
  selectedItem,
  onSelectItem,
  onPositionChange,
  onSizeChange,
  onRotationChange
}: StageGridProps) {
  return (
    <div 
      id="stage-grid"
      className="relative w-full aspect-[16/9] bg-gray-900 border-2 border-gray-700 rounded-lg overflow-hidden"
    >
      {/* Stage front indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gray-800 flex items-center justify-center text-sm text-gray-400">
        Stage Front
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-0.5 pointer-events-none">
        {Array.from({ length: 72 }).map((_, i) => (
          <div key={i} className="bg-gray-800/30" />
        ))}
      </div>

      {/* Stage items */}
      {items.map((item) => {
        const equipment = getEquipmentById(item.equipment_id);
        if (!equipment) return null;

        return (
          <DraggableItem
            key={item.id}
            id={item.id}
            position={{ x: item.position_x, y: item.position_y }}
            size={{ width: item.width, height: item.height }}
            rotation={item.rotation}
            onPositionChange={onPositionChange}
            onSizeChange={onSizeChange}
            onRotationChange={onRotationChange}
          >
            <div
              className={`w-full h-full flex flex-col items-center justify-center p-2 rounded-lg cursor-move
                ${selectedItem === item.id ? 'bg-blue-500/80' : 'bg-gray-700/80'}
                hover:bg-gray-600/80 transition-colors relative group`}
              onClick={() => onSelectItem(item.id)}
            >
              <div className="absolute inset-2 flex items-center justify-center">
                <Image
                  src={equipment.svgFile}
                  alt={equipment.label}
                  width={100}
                  height={100}
                  className="w-full h-full object-contain"
                  style={{
                    filter: selectedItem === item.id ? 'brightness(1.2)' : 'none'
                  }}
                />
              </div>
              <div className="absolute bottom-1 left-1 right-1 text-center bg-black/50 rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                {equipment.label}
              </div>
            </div>
          </DraggableItem>
        );
      })}
    </div>
  )
} 
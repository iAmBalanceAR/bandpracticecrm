"use client"
import React from 'react'
import { StagePlotItem, Position, Size } from '../types'
import { getEquipmentById } from '../utils/equipment'
import DraggableItem from './draggable-item'
import Image from 'next/image'
import { X } from 'lucide-react'

interface StageGridProps {
  items: StagePlotItem[]
  selectedItem: string | null
  onSelectItem: (id: string | null) => void
  onPositionChange: (id: string, position: Position) => void
  onSizeChange: (id: string, size: Size) => void
  onRotationChange: (id: string, rotation: number) => void
  onDeleteItem: (id: string) => void
  onLabelChange?: (id: string, label: string) => void
}

export default function StageGrid({
  items,
  selectedItem,
  onSelectItem,
  onPositionChange,
  onSizeChange,
  onRotationChange,
  onDeleteItem,
  onLabelChange
}: StageGridProps) {
  return (
    <div 
      id="stage-grid"
      className="relative w-full aspect-[16/9] bg-red-900/70  border-2 border-gray-700 rounded-lg overflow-hidden"
    >
      {/* Stage front indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/80 flex items-center font-mono z-10 justify-center text-sm text-gray-400">
        Stage Front
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-6  gap-[1px] pointer-events-none">
        {Array.from({ length: 72 }).map((_, i) => (
          <div key={i} className="bg-gray-900 " />
        ))}
      </div>

      {/* Stage items */}
      {items.map((item) => {
        const equipment = getEquipmentById(item.equipment_id);
        if (!equipment) return null;

        const displayLabel = item.customLabel || equipment.label;

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
              className={`w-full h-full flex flex-col items-center justify-center p-1 rounded-md cursor-move
                bg-transparent hover:bg-gray-600/80 transition-colors relative group border-white border-1`}
              onClick={() => onSelectItem(item.id)}
            >
              <div className="absolute inset-1 flex items-center justify-center">
                <Image
                  src={equipment.svgFile}
                  alt={equipment.label}
                  width={100}
                  height={100}
                  className="w-full h-full object-contain border-1 border-white"
                  style={{
                    filter: `${selectedItem === item.id ? 'brightness(2)' : 'none'} drop-shadow(0 0 1px white)`,
                    WebkitFilter: `${selectedItem === item.id ? 'brightness(2)' : 'none'} drop-shadow(0 0 1px white)`
                  }}
                />
              </div>
              {item.showLabel !== false && (
                <div 
                  className="absolute bottom-0.5 left-0.5 right-0.5 text-center bg-black/50 rounded px-1 py-0.5 text-xs"
                  contentEditable={selectedItem === item.id}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => {
                    if (selectedItem === item.id && onLabelChange) {
                      const newLabel = e.currentTarget.textContent || equipment.label;
                      onLabelChange(item.id, newLabel);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                >
                  {displayLabel}
                </div>
              )}
              {selectedItem === item.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteItem(item.id)
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </DraggableItem>
        );
      })}
    </div>
  )
} 
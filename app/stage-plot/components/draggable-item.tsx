"use client"
import React, { useRef, useEffect, useState } from 'react'
import { DraggableItemProps, Position, Size } from '../types'

export default function DraggableItem({
  id,
  position,
  size,
  rotation,
  onPositionChange,
  onSizeChange,
  onRotationChange,
  children
}: DraggableItemProps) {
  const itemRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState<Position | null>(null)
  const [initialPosition, setInitialPosition] = useState<Position>(position)

  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart || !itemRef.current) return

      const parentRect = itemRef.current.parentElement?.getBoundingClientRect()
      if (!parentRect) return

      if (isDragging) {
        const dx = ((e.clientX - dragStart.x) / parentRect.width) * 100
        const dy = ((e.clientY - dragStart.y) / parentRect.height) * 100
        
        const newX = Math.max(0, Math.min(100 - size.width, initialPosition.x + dx))
        const newY = Math.max(0, Math.min(100 - size.height, initialPosition.y + dy))
        
        onPositionChange(id, { x: newX, y: newY })
      } else if (isResizing) {
        const dx = ((e.clientX - dragStart.x) / parentRect.width) * 100
        const dy = ((e.clientY - dragStart.y) / parentRect.height) * 100
        
        const newWidth = Math.max(10, Math.min(100 - position.x, size.width + dx))
        const newHeight = Math.max(10, Math.min(100 - position.y, size.height + dy))
        
        onSizeChange(id, { width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setDragStart(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [id, isDragging, isResizing, dragStart, initialPosition, position, size, onPositionChange, onSizeChange])

  const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'resize') => {
    e.stopPropagation()
    if (type === 'drag') {
      setIsDragging(true)
      setInitialPosition(position)
    } else {
      setIsResizing(true)
    }
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  return (
    <div
      ref={itemRef}
      className="absolute"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${size.width}%`,
        height: `${size.height}%`,
        transform: `rotate(${rotation}deg)`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={(e) => handleMouseDown(e, 'drag')}
    >
      {children}
      
      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-white/20 rounded-bl cursor-se-resize"
        onMouseDown={(e) => handleMouseDown(e, 'resize')}
      />
    </div>
  )
} 
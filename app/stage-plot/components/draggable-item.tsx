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
  children,
  readOnly = false
}: DraggableItemProps & { readOnly?: boolean }) {
  const itemRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState<Position | null>(null)
  const [initialPosition, setInitialPosition] = useState<Position>(position)
  const [initialSize, setInitialSize] = useState<Size>(size)
  const [aspectRatio, setAspectRatio] = useState<number>(size.width / size.height)

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
        
        // Calculate new dimensions while preserving aspect ratio
        let newWidth: number
        let newHeight: number
        
        // Use the larger change (dx or dy) to determine the new size
        if (Math.abs(dx) > Math.abs(dy)) {
          newWidth = Math.max(5, Math.min(100 - position.x, initialSize.width + dx))
          newHeight = newWidth / aspectRatio
        } else {
          newHeight = Math.max(5, Math.min(100 - position.y, initialSize.height + dy))
          newWidth = newHeight * aspectRatio
        }
        
        // Ensure we don't exceed stage boundaries
        if (newWidth > (100 - position.x)) {
          newWidth = 100 - position.x
          newHeight = newWidth / aspectRatio
        }
        if (newHeight > (100 - position.y)) {
          newHeight = 100 - position.y
          newWidth = newHeight * aspectRatio
        }
        
        // Ensure minimum size
        if (newWidth < 5) {
          newWidth = 5
          newHeight = newWidth / aspectRatio
        }
        if (newHeight < 5) {
          newHeight = 5
          newWidth = newHeight * aspectRatio
        }
        
        onSizeChange(id, { width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging || isResizing) {
        setIsDragging(false)
        setIsResizing(false)
        setDragStart(null)
        
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [id, isDragging, isResizing, dragStart, initialPosition, initialSize, position, size, onPositionChange, onSizeChange, aspectRatio])

  const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'resize') => {
    if (readOnly) return
    e.stopPropagation()
    if (type === 'drag') {
      setIsDragging(true)
      setInitialPosition(position)
    } else {
      setIsResizing(true)
      setInitialSize(size)
      setAspectRatio(size.width / size.height)
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
        cursor: readOnly ? 'default' : isDragging ? 'grabbing' : 'grab',
        userSelect: 'none'
      }}
      onMouseDown={(e) => handleMouseDown(e, 'drag')}
    >
      {children}
      
      {/* Resize handle - only show if not readOnly */}
      {!readOnly && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-white/20 rounded-bl cursor-se-resize"
          onMouseDown={(e) => handleMouseDown(e, 'resize')}
        />
      )}
    </div>
  )
} 
"use client"

import { useState, useEffect } from 'react'
import { InputListProps, InputListRow } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

export function InputList({
  riderId,
  initialRows = [],
  onRowsChange,
  readOnly = false
}: InputListProps) {
  const [rows, setRows] = useState<InputListRow[]>(() => {
    if (initialRows.length > 0) return initialRows
    // Start with one empty row by default
    return [{
      id: uuidv4(),
      rider_id: riderId || '',
      channel_number: 1,
      instrument: '',
      microphone: ''
    }]
  })

  useEffect(() => {
    onRowsChange(rows)
  }, [rows, onRowsChange])

  const addRow = () => {
    setRows(currentRows => [
      ...currentRows,
      {
        id: uuidv4(),
        rider_id: riderId || '',
        channel_number: currentRows.length + 1,
        instrument: '',
        microphone: ''
      }
    ])
  }

  const removeRow = (id: string) => {
    setRows(currentRows => {
      const newRows = currentRows.filter(row => row.id !== id)
      // Reorder channel numbers
      return newRows.map((row, index) => ({
        ...row,
        channel_number: index + 1
      }))
    })
  }

  const updateRow = (id: string, field: keyof InputListRow, value: string | number) => {
    setRows(currentRows =>
      currentRows.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[80px_1fr_1fr_60px] gap-2 items-center font-semibold text-sm text-gray-400">
        <div>CH</div>
        <div>INSTRUMENT</div>
        <div>MICROPHONE</div>
        <div></div>
      </div>
      
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-[80px_1fr_1fr_60px] gap-2 items-center">
            <Input
              type="number"
              value={row.channel_number}
              onChange={(e) => updateRow(row.id, 'channel_number', parseInt(e.target.value))}
              className="w-full text-gray-400"
              disabled={readOnly}
            />
            <Input
              type="text"
              value={row.instrument}
              onChange={(e) => updateRow(row.id, 'instrument', e.target.value)}
              className="w-full text-gray-400"
              placeholder="Enter instrument..."
              disabled={readOnly}
            />
            <Input
              type="text"
              value={row.microphone}
              onChange={(e) => updateRow(row.id, 'microphone', e.target.value)}
              className="w-full text-gray-400"
              placeholder="Enter microphone..."
              disabled={readOnly}
            />
            {!readOnly && rows.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRow(row.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-100/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          className="mt-4 text-blue-500 border-blue-500 hover:bg-blue-100/10"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
      )}
    </div>
  )
} 
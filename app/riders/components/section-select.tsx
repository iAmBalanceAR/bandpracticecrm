"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { SectionSelectProps } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function SectionSelect({
  type,
  selectedSections,
  onSectionToggle,
  onCustomSectionAdd,
  availableSections
}: SectionSelectProps) {
  const [selectedSection, setSelectedSection] = useState<string>('')
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false)
  const [customSectionName, setCustomSectionName] = useState('')

  const handleAddSection = () => {
    if (selectedSection === 'custom') {
      setIsCustomDialogOpen(true)
    } else if (selectedSection) {
      onSectionToggle(selectedSection)
      setSelectedSection('')
    }
  }

  const handleCustomSectionAdd = () => {
    if (customSectionName.trim()) {
      onCustomSectionAdd(customSectionName.trim())
      setCustomSectionName('')
      setIsCustomDialogOpen(false)
    }
  }

  const availableOptions = availableSections.filter(
    section => !selectedSections.has(section.id)
  )

  return (
    <div className="space-y-4">
      <h3 className="text-2xl mb-0">
        <span className="mx-0 text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          Add Sections
        </span>
        <div className="border-green-600 border-b-2 -mt-2 mb-0  h-2 ml-0 mr-0"></div>
      </h3>
      <div className="flex items-center gap-2">
        
        <Select
          value={selectedSection}
          onValueChange={setSelectedSection}
        >
          <SelectTrigger>
            <SelectValue className="text-gray-400 focus:text-gray-500 focus:border-white border-white text-sm" placeholder="Select a section to add" />
          </SelectTrigger>
          <SelectContent  className="bg-[#111C44] hover:bg-[#030817] text-white">
            {availableOptions.length === 0 && (
              <SelectItem value="none" disabled>No sections found</SelectItem>
            )}
            {availableOptions.map((section) => (
              <SelectItem
                key={section.id}
                value={section.id}
                className="bg-[#111C44] hover:bg-[#030817] cursor-pointer text-white text-sm"
              >
                {section.name}
              </SelectItem>
            ))}
            <SelectItem value="custom" className="cursor-pointer bg-[#111C44] hover:bg-[#030817] ">
              Add Custom Section
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            handleAddSection()
          }}
          disabled={!selectedSection}
          size="icon"
          className="text-white hover:font-bold bg-blue-700 border-green-400 hover:bg-green-600 border h-10 w-10 cursor-pointer">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent className="bg-[#030817] p-6 rounded-md border-blue-400 border text-white">
          <DialogHeader>
            <DialogTitle>Add Custom Section</DialogTitle>
            <DialogDescription>
              Enter a name for your custom section
            </DialogDescription>
          </DialogHeader>
          <Input
            value={customSectionName}
            onChange={(e) => setCustomSectionName(e.target.value)}
            placeholder="Section name"
            className="mt-4"
          />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCustomDialogOpen(false)}
              className="bg-red-700 border-black hover:bg-red-600 border h-10 p-2 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-green-700 border-black hover:bg-green-600 border h-10 p-2 cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                handleCustomSectionAdd()
              }}
                              
            >
              Add Section
            </Button>
          </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  )
} 
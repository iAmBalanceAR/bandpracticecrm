"use client"

import { motion } from 'framer-motion'
import { X, Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react'
import { RiderSectionProps } from '../types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export function RiderSection({
  section,
  content,
  onContentChange,
  onRemove
}: RiderSectionProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[100px] focus:outline-none p-4 text-gray-200 text-base leading-relaxed w-full',
      },
    },
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <Card className="bg-[#111C44] border-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold w-full">
            <h3 className="text-2xl mb-0">
              <span className="mx-0 text-white text-shadow-sm font-mono text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                {'custom' in section ? section.name : section.name}
              </span>
              <div className="border-blue-500 border-b-2 -mt-2 mb-0 h-2 ml-0 mr-0"></div>
            </h3>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }}
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            <div className="bg-[#030817] hover:bg-[#0F1729] p-1 rounded-sm border-slate-600 border">
              <X className="font-bold text-red-700" />
            </div>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-[#1A2652] border border-blue-900/50 overflow-hidden">
            <div className="border-b border-blue-900/50 p-2 flex gap-2 bg-[#111C44]">
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  editor.chain().focus().toggleBold().run()
                }}
                className={editor.isActive('bold') ? 'bg-blue-900/50' : ''}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  editor.chain().focus().toggleItalic().run()
                }}
                className={editor.isActive('italic') ? 'bg-blue-900/50' : ''}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }}
                className={editor.isActive('heading', { level: 2 }) ? 'bg-blue-900/50' : ''}
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  editor.chain().focus().toggleBulletList().run()
                }}
                className={editor.isActive('bulletList') ? 'bg-blue-900/50' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  editor.chain().focus().toggleOrderedList().run()
                }}
                className={editor.isActive('orderedList') ? 'bg-blue-900/50' : ''}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>
            <div className="prose-lg prose-invert w-full">
              <EditorContent editor={editor} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 
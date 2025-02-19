import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  minHeight = '100px'
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: `prose prose-invert max-w-none focus:outline-none px-4 pt-0 pb-4 text-gray-200 text-base leading-relaxed w-full min-h-[${minHeight}]`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="rounded-md bg-[#1A2652] border-2 border-[#111C44] overflow-hidden">
      <div className="border-b border-blue-900/50 p-2 flex gap-2 bg-[#111C44]">
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-blue-900/50' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-blue-900/50' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-blue-900/50' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-blue-900/50' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-blue-900/50' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>
      <div className="prose-lg prose-invert w-full">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
} 
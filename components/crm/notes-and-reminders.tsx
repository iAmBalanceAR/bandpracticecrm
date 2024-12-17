"use client"
import * as React from 'react'
const { useState, useEffect } = React
import { PlusCircle, X, CheckCircle2, Circle, Pencil, Trash2, Calendar, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Calendar as CalendarComponent } from "../ui/calendar"
import { format } from "date-fns"
import type { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, AwaitedReactNode } from 'react'

interface Note {
  id: string
  title: string
  content: string
  date: string
}

interface Reminder {
  id: string
  text: string
  completed: boolean
  date: Date
}

interface VenueNote extends Note {
  venueId?: string;
  noteType: 'contact' | 'booking' | 'technical' | 'general';
  followUpDate?: Date;
}

interface VenueList {
  id: string;
  name: string;
  description?: string;
  venues: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  }[];
}

export default function NotesAndReminders() {
  const [notes, setNotes] = useState<Note[]>([
    { id: '1', title: 'Setlist Ideas', content: 'Start with high energy, mix in some ballads, end with a bang!', date: '2024-03-15' },
    { id: '2', title: 'New Song Concept', content: 'Blend rock and electronic elements, focus on catchy chorus', date: '2024-03-16' },
  ])
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', text: 'Call venue about equipment setup', completed: false, date: new Date('2024-03-20T14:00:00') },
    { id: '2', text: 'Finalize merch designs', completed: true, date: new Date('2024-03-22T10:00:00') },
  ])
  const [newNote, setNewNote] = useState({ title: '', content: '' })
  const [newReminder, setNewReminder] = useState({ text: '', date: new Date() })
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const addNote = () => {
    if (newNote.title && newNote.content) {
      setNotes([...notes, { ...newNote, id: Date.now().toString(), date: new Date().toISOString().split('T')[0] }])
      setNewNote({ title: '', content: '' })
    }
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note: { id: string }) => note.id !== id))
  }

  const editNote = (id: string) => {
    setEditingNoteId(id)
    const noteToEdit = notes.find((note: { id: string }) => note.id === id)
    if (noteToEdit) {
      setNewNote({ title: noteToEdit.title, content: noteToEdit.content })
    }
  }

  const updateNote = () => {
    if (editingNoteId) {
      setNotes(notes.map((note: Note) => 
        note.id === editingNoteId ? { ...note, ...newNote, date: new Date().toISOString().split('T')[0] } : note
      ))
      setEditingNoteId(null)
      setNewNote({ title: '', content: '' })
    }
  }

  const addReminder = () => {
    if (newReminder.text) {
      if (editingReminderId) {
        setReminders(reminders.map((reminder: Reminder) =>
          reminder.id === editingReminderId ? { ...reminder, ...newReminder } : reminder
        ))
        setEditingReminderId(null)
      } else {
        setReminders([...reminders, { id: Date.now().toString(), ...newReminder, completed: false }])
      }
      setNewReminder({ text: '', date: new Date() })
    }
  }

  const toggleReminder = (id: string) => {
    setReminders(reminders.map((reminder: Reminder) =>
      reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
    ))
  }

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter((reminder: { id: string }) => reminder.id !== id))
  }

  const editReminder = (id: string) => {
    setEditingReminderId(id)
    const reminderToEdit = reminders.find((reminder: { id: string }) => reminder.id === id)
    if (reminderToEdit) {
      setNewReminder({ text: reminderToEdit.text, date: reminderToEdit.date })
    }
  }

  const cardHoverClass = isLoaded
    ? "transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-md hover:shadow-green-400/50 hover:z-10"
    : ""
    return (
      <div className="pl-4 pt-3 bg-[#0f1729] text-white min-h-screen">
      <h1 className="text-4xl font-mono mb-6">
        <span className="w-[100%]  text-white text-shadow-smfont-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
        Notes &amp; Reminders
        </span>
      </h1>
      <div className="border-[#d83b34] border-b-2 -mt-10 mb-6 w-[100%] h-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <Card className="bg-[#111C44] text-white shadow-sm border-[#1E293B] border shadow-green-400">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Notes</span>
            <Button 
              onClick={editingNoteId ? updateNote : addNote} 
              size="sm" 
              className="bg-green-700 text-white hover:bg-green-600"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              {editingNoteId ? 'Update Note' : 'Add Note'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Note Title"
              required            
              value={newNote.title}
              onChange={(e: { target: { value: any } }) => setNewNote({ ...newNote, title: e.target.value })}
              className="bg-[#1B2559]"
            />
            <Textarea
              placeholder="Note Content"
              required            
              value={newNote.content}
              onChange={(e: { target: { value: any } }) => setNewNote({ ...newNote, content: e.target.value })}
              className="bg-[#1B2559]"
            />
          </div>
          <ScrollArea className="min-h-[300px] mt-4">
            <AnimatePresence>
              {notes.map((note: { id: string; title: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; content: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; date: string | number | Date }) => (
                  <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -10, y: 0 }}
                  animate={{ opacity: 1, x: -3, y: 0 }}
                  exit={{ opacity: 0, x: 0, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-[#2D3748] pl-4 pt-1 rounded-sm mb-4 relative ${cardHoverClass}`}
                >
                  <div className="absolute top-2 right-0 space-x-1">
                    <Button onClick={() => editNote(note.id)} size="sm" variant="ghost" className="bg-[#2D3748] hover:bg-[#2D3748] hover:text-lime-400 hover:shadow-green-400 hover:shadow-sm hover:font-semibold text-white ">
                      <Pencil className="w-4 h-4 bg-[#2D3748] hover:bg-[#2D3748]" />
                    </Button>
                    <Button onClick={() => deleteNote(note.id)} size="sm" variant="ghost" className="bg-[#2D3748] hover:bg-[#2D3748] hover:text-rose-500 hover:shadow-rose-500 hover:shadow-sm hover:font-semibold text-red-500">
                      <Trash2 className="w-4 h-4 bg-[#2D3748] hover:bg-[#2D3748]" />
                    </Button>
                  </div>
                  <h3 className="font-bold text-xl pt-1 mb-2">{String(note.title)}</h3>
                  <p className="text-sm text-gray-300 mb-2">{String(note.content)}</p>
                  <div className="text-xs text-gray-400 width-full float-right">
                    <Calendar className="w-3 h-3 float-left mt-0 mr-1" />
                    <span className="pr-2">{format(note.date, "MMMM dd, yyyy")}</span>
                  </div>
                  <div className='clear-both pb-2'></div>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="bg-[#111C44] text-white shadow-sm border-[#1E293B] border shadow-green-400">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Reminders</span>
            <Button 
              onClick={addReminder} 
              size="sm" 
              className="bg-green-700 text-white hover:bg-green-600"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              {editingReminderId ? 'Update Reminder' : 'Add Reminder'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="New Reminder"
              value={newReminder.text}
              onChange={(e: { target: { value: any } }) => setNewReminder({ ...newReminder, text: e.target.value })}
              className="bg-[#1B2559] w-full"
            />
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="bg-[#1B2559] hover:text-white focus:text-white hover:bg-black focus:bg-black border-grey-600 text-white flex-1">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(newReminder.date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#0f1729] border-[#4A5568] text-white">
                  <CalendarComponent
                    mode="single"
                    selected={newReminder.date}
                    onSelect={(date) => date && setNewReminder({ ...newReminder, date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="bg-[#1B2559] hover:text-white focus:text-white hover:bg-black focus:bg-black border-grey-600 text-white flex-1">
                    <Clock className="mr-2 h-4 w-4" />
                    {format(newReminder.date, "h:mm a")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 bg-[#0f1729] border-[#4A5568] text-white">
                  <div className="flex space-x-2">
                    <select
                      value={format(newReminder.date, "h")}
                      onChange={(e) => {
                        const newDate = new Date(newReminder.date)
                        let hours = parseInt(e.target.value)
                        const isPM = newDate.getHours() >= 12
                        if (isPM) hours = hours + 12
                        newDate.setHours(hours)
                        setNewReminder({ ...newReminder, date: newDate })
                      }}
                      className="w-20 bg-[#1B2559] rounded-md"
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>

                    <select
                      value={format(newReminder.date, "mm")}
                      onChange={(e) => {
                        const newDate = new Date(newReminder.date)
                        newDate.setMinutes(parseInt(e.target.value))
                        setNewReminder({ ...newReminder, date: newDate })
                      }}
                      className="w-20 bg-[#1B2559] rounded-md"
                    >
                      {[...Array(60)].map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(newReminder.date)
                        const hours = newDate.getHours()
                        newDate.setHours(hours >= 12 ? hours - 12 : hours + 12)
                        setNewReminder({ ...newReminder, date: newDate })
                      }}
                      className="w-20 bg-[#1B2559]"
                    >
                      {format(newReminder.date, "a")}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <ScrollArea className="h-[300px] mt-4">
            <AnimatePresence>
              {reminders.map((reminder: { id: string; completed: any; text: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; date: string | number | Date }) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 1, x: 0 }}
                  animate={{ opacity: 1, x: 5 }}
                  exit={{ opacity: 0, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-[#2D3748] pb-4 pr-4 pl-4 pt-1 rounded-sm mb-4 relative ${cardHoverClass}`}
                >
                  <div className="absolute top-2 right-2 space-x-2">
                    <Button
                      onClick={() => editReminder(reminder.id)}
                      size="sm"
                      variant="ghost"
                      className="bg-[#2D3748] hover:bg-[#2D3748] hover:text-lime-400 hover:shadow-green-400 hover:shadow-sm hover:font-semibold text-white"
                    >
                      <Pencil className="w-4 h-4  bg-[#2D3748] hover:bg-[#2D3748]" />
                    </Button>
                    <Button
                      onClick={() => deleteReminder(reminder.id)}
                      size="sm"
                      variant="ghost"
                      className="bg-[#2D3748] hover:bg-[#2D3748] hover:text-rose-500 hover:shadow-rose-500 hover:shadow-sm hover:font-semibold text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-start pr-20 mb-2">
                    <Button
                      onClick={() => toggleReminder(reminder.id)}
                      size="sm"
                      variant="ghost"
                      className={reminder.completed ? "text-green-500 mt-0 bg-[#2D3748] hover:bg-[#2D3748] hover:shadow-lime-400 hover:shadow-sm" : "text-rose-400 mt-0 bg-[#2D3748] hover:bg-[#2D3748] hover:shadow-yellow-400 hover:shadow-sm"}
                    >
                      {reminder.completed ? <CheckCircle2 className="w-5 h-5 bg-[#2D3748] hover:bg-[#2D3748] text-red-400" /> : <Circle className="w-5 h-5 bg-[#2D3748] hover:bg-[#2D3748] text-yellow-400" />}
                    </Button>
                    <span className={`${reminder.completed ? 'line-through mt-0 ml-1 text-rose-500' : ''}`}>
                      {String(reminder.text)}
                    </span>
                  </div>
                  <div className="flex space-x-1 text-xs pt-1 text-gray-400 float-right">
                    <Calendar className="w-3 h-3" />
                    <span>{format(reminder.date, "MMMM dd, yyyy")} | </span>
                    <Clock className="w-3 h-3" />
                    <span>{format(reminder.date, "h:mma")}</span>
                  </div>
                  <div className="clear-left pb-2"></div>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
    </div>
  )
}
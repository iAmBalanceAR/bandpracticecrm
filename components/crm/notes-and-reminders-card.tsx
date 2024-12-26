"use client"

import React, { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Pencil, Trash2, Calendar, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"

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

export default function NotesAndReminders() {
  const [notes, setNotes] = useState<Note[]>([
    { id: '1', title: 'Setlist Ideas', content: 'Start with high energy, mix in some ballads, end with a bang!', date: '2024-03-15' },
    { id: '2', title: 'New Song Concept', content: 'Blend rock and electronic elements, focus on catchy chorus', date: '2024-03-16' },
    { id: '3', title: 'Setlist Ideas', content: 'Start with high energy, mix in some ballads, end with a bang!', date: '2024-03-15' },
    { id: '4', title: 'New Song Concept', content: 'Blend rock and electronic elements, focus on catchy chorus', date: '2024-03-16' },
  ])
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', text: 'Call venue about equipment setup', completed: false, date: new Date('2024-03-20T14:00:00') },
    { id: '2', text: 'Finalize merch designs', completed: true, date: new Date('2024-03-22T10:00:00') },
    { id: '3', text: 'Call venue about equipment setup', completed: false, date: new Date('2024-03-20T14:00:00') },
    { id: '4', text: 'Finalize merch designs', completed: true, date: new Date('2024-03-22T10:00:00') },
  ])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note: Note) => note.id !== id))
  }

  const toggleReminder = (id: string) => {
    setReminders(reminders.map((reminder: Reminder) => 
      reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
    ))
  }

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter((reminder: Reminder) => reminder.id !== id))
  }

  const cardHoverClass = isLoaded
    ? "transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-md hover:shadow-green-400/50 hover:z-10"
    : ""

  return (
    <div className="p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg mb-1 font-semibold">Notes</h3>
          <div className="">
            <ScrollArea>
              <div className="pr-4">
                <AnimatePresence>
                  {notes.map((note: Note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 1, x: 0, y: 0 }}
                      whileHover={{ scale: 1.01 }}
                      animate={{ opacity: 1, x: -3, y: 0 }}
                      exit={{ opacity: 0, x: 0, y: 0 }}
                      transition={{ type: 'tween', duration: 0.02 }}
                      className={`bg-[#1B2559] border-blue-800 ml-2 border p-2 rounded-md mb-4 relative ${cardHoverClass}`}
                    >
                      <div className="absolute top-2 right-2 space-x-2">
                        <Button onClick={() => deleteNote(note.id)} size="sm" variant="ghost" className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <h3 className="font-bold text-lg mb-2">{note.title}</h3>
                      <p className="text-sm text-gray-300 mb-1">{note.content}</p>
                      <span className="text-xs text-gray-400">{note.date}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">Reminders</h3>
          <div className="h-[400px]">
            <ScrollArea>
              <div className="pr-4">
                <AnimatePresence>
                  {reminders.map((reminder: Reminder) => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 1, x: -5 }}
                      whileHover={{ scale: 1.02 }}
                      animate={{ opacity: 1, x: 5 }}
                      exit={{ opacity: 0, y: 0 }}
                      transition={{ type: 'tween', duration: 0.02 }}
                      className={`bg-[#1B2559] mr-8 border-blue-800 border p-4 rounded-md mb-4 relative ${cardHoverClass}`}
                    >
                      <div className="absolute top-2 right-2 space-x-2 ">
                        <Button
                          onClick={() => deleteReminder(reminder.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-start pr-20 mb-2">
                        <Button
                          onClick={() => toggleReminder(reminder.id)}
                          size="sm"
                          variant="ghost"
                          className={reminder.completed ? "text-green-500 mt-0.5" : "text-gray-400 mt-0.5"}
                        >
                          {reminder.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </Button>
                        <span className={`flex-grow ${reminder.completed ? 'line-through text-gray-500' : ''}`}>
                          {reminder.text}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{format(reminder.date, "MM/dd/yy")}</span>
                        <Clock className="w-3 h-3" />
                        <span>{format(reminder.date, "h:mma")}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}
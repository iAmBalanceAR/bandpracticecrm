"use client"

import * as React from "react"
import { useSupabase } from '@/components/providers/supabase-client-provider'
import { RemindersAlert } from '@/components/crm/reminders-alert'
import { AnimatePresence, motion } from "framer-motion"
import type { Reminder } from '@/components/crm/reminders-alert'

export function RemindersAlertSystem() {
  const { user, supabase } = useSupabase()
  const [reminders, setReminders] = React.useState<Reminder[]>([])
  const [overdueReminders, setOverdueReminders] = React.useState<Reminder[]>([])
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function getReminders() {
      if (!user) return
      
      const { data, error } = await supabase
        .from('reminders')
        .select()
        .eq('created_by', user.id)
      
      if (!error && data) {
        setReminders(data)
        // Filter overdue reminders that aren't completed
        const overdue = data.filter(r => !r.completed && new Date(r.due_date) <= new Date())
        setOverdueReminders(overdue)
      }
    }
    getReminders()

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      getReminders()
    }, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [user, supabase])

  const handleComplete = async (id: string) => {
    try {
      setUpdatingId(id)
      
      // Update the reminder in the database
      const { error } = await supabase
        .from('reminders')
        .update({ completed: true })
        .eq('id', id)

      if (error) throw error

      // Update local state
      setReminders(prev => prev.map(r => 
        r.id === id ? { ...r, completed: true } : r
      ))
      setOverdueReminders(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error('Error completing reminder:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <AnimatePresence>
      {overdueReminders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed top-20 right-8 z-50"
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
        >
          <div className="bg-[#111c44] border border-[#008ffb] rounded-lg shadow-lg shadow-[#008ffb]/20 p-4 max-w-sm">
            <RemindersAlert 
              reminders={reminders} 
              onUpdate={handleComplete}
              sidebarOpen={true}
              updatingId={updatingId} 
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 
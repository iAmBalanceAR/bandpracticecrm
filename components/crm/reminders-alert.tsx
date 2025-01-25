import * as React from "react"
import { Bell, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from "@/lib/utils"
import { useSupabase } from '../providers/supabase-client-provider'
import { Button } from "../ui/button"

export interface Reminder {
  id: string
  title: string
  description: string
  due_date: string
  completed: boolean
  lead_id: string
  created_by: string
  created_by_email: string
  created_at: string
  lead: {
    title: string
    company: string | null
  }
}

interface RemindersAlertProps {
  sidebarOpen: boolean
  reminders?: Reminder[]
  onUpdate: (id: string) => Promise<void>
}

export const RemindersAlert: React.FC<RemindersAlertProps> = ({ sidebarOpen, reminders = [], onUpdate }) => {
  const [deletingIds, setDeletingIds] = React.useState<string[]>([])
  const { supabase } = useSupabase()
  
  if (!Array.isArray(reminders)) return null
  
  const overdueReminders = reminders.filter(r => !r.completed && new Date(r.due_date) <= new Date())
  
  if (overdueReminders.length === 0) return null

  const handleDelete = async (id: string) => {
    try {
      setDeletingIds(prev => [...prev, id])
      
      const { error } = await supabase
        .rpc('delete_reminder', {
          reminder_id: id
        })
      
      if (error) throw error

      // Remove from local state immediately
      await onUpdate(id)
      
      // Keep the ID in deletingIds permanently for this session
      // This way it won't reappear even if polling catches it
      setTimeout(() => {
        // Visual transition only - actual state is managed by parent
        setDeletingIds(prev => [...prev])
      }, 500) // Match this with CSS transition duration
    } catch (error) {
      console.error('Failed to delete reminder:', error)
      setDeletingIds(prev => prev.filter(x => x !== id))
    }
  }

  return (
    <div className={cn(
      "mt-4 mb-4 bg-[#1B2559] rounded-lg overflow-hidden transition-all duration-300",
      "ring-2 ring-red-500/50"
    )}>
      <div className="p-3">
        <div className="flex items-center gap-2 text-red-400">
          <Bell className="h-5 w-5" />
          <span className={cn(
            "font-medium",
            !sidebarOpen && "hidden"
          )}>
            Overdue Reminders ({overdueReminders.length})
          </span>
        </div>
        
        {sidebarOpen && (
          <div className="mt-2 space-y-2">
            {overdueReminders.map((reminder) => (
              <div 
                key={reminder.id} 
                className={cn(
                  "text-sm p-2 bg-[#242f6a] rounded-md relative group transition-all duration-500",
                  deletingIds.includes(reminder.id) && "opacity-0 transform translate-x-full"
                )}
              >
                <div className="font-medium text-white flex justify-between items-start">
                  <span>{reminder.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-1 h-6 w-6 p-0 hover:bg-red-500/20 text-red-400"
                    onClick={() => handleDelete(reminder.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-blue-400 text-xs">
                  {reminder.lead?.company || reminder.lead?.title}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  {reminder.description}
                </div>
                <div className="text-red-400 text-xs mt-1">
                  Due: {format(new Date(reminder.due_date), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
import * as React from "react"
import { Bell, X, Loader2, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from "@/lib/utils"
import { useSupabase } from '../providers/supabase-client-provider'
import { Button } from "../ui/button"
import Link from "next/link"

// Utility function to strip HTML tags from text
const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

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
  updatingId?: string | null
}

export const RemindersAlert: React.FC<RemindersAlertProps> = ({ 
  sidebarOpen, 
  reminders = [], 
  onUpdate,
  updatingId 
}) => {
  const { supabase } = useSupabase()
  
  if (!Array.isArray(reminders)) return null
  
  const overdueReminders = reminders.filter(r => !r.completed && new Date(r.due_date) <= new Date())
  
  if (overdueReminders.length === 0) return null

  const handleViewLead = async (reminder: Reminder) => {
    // Mark as completed first
    await onUpdate(reminder.id);
    // Navigation will happen via the Link component
  };

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
                  updatingId === reminder.id && "opacity-50"
                )}
              >
                <div className="relative z-10 transition-all duration-300 group-hover:blur-sm">
                  <div className="font-medium text-white">
                    <span>{reminder.title}</span>
                  </div>
                  <div className="text-blue-400 text-xs">
                    {reminder.lead?.company || reminder.lead?.title}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {stripHtml(reminder.description)}
                  </div>
                  <div className="text-red-400 text-xs mt-1">
                    Due: {format(new Date(reminder.due_date), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>

                {/* Hover Action Buttons */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  {updatingId === reminder.id ? (
                    <div className="bg-[#242f6a]/80 p-2 rounded-md">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    </div>
                  ) : (
                    <>
                      <Link 
                        href={`/leads/${reminder.lead_id}`}
                        onClick={() => handleViewLead(reminder)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors w-32 justify-center"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Lead
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-medium h-auto w-32 justify-center"
                        onClick={() => onUpdate(reminder.id)}
                        disabled={updatingId === reminder.id}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Close Alert
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
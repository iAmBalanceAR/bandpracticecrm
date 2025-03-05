"use client"

import React, { useState } from 'react'
import { ProgressiveCard } from '../utils/progressive-card'
import { useData } from '../utils/data-provider'
import { Bell, Calendar, Check, Clock, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns'

export const RemindersCard: React.FC = () => {
  const { reminders, isLoading, refreshData } = useData()
  const router = useRouter()
  const [expandedReminder, setExpandedReminder] = useState<string | null>(null)
  
  const isEmpty = reminders.length === 0 && !isLoading
  
  const emptyStateContent = (
    <div className="text-center p-4">
      <Bell className="h-12 w-12 text-orange-500/50 mx-auto mb-2" />
      <h3 className="text-lg font-medium">No reminders</h3>
      <p className="text-sm text-gray-400">Add reminders to stay on top of important tasks</p>
    </div>
  )
  
  // Format the date in a human-readable way
  const formatReminderDate = (date: string) => {
    const reminderDate = new Date(date)
    
    if (isToday(reminderDate)) {
      return 'Today'
    } else if (isTomorrow(reminderDate)) {
      return 'Tomorrow'
    } else if (isPast(reminderDate)) {
      return 'Overdue'
    } else if (isPast(addDays(new Date(), 7)) && !isPast(reminderDate)) {
      return 'This week'
    } else {
      return format(reminderDate, 'MMM d, yyyy')
    }
  }
  
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-green-500'
      default:
        return 'text-blue-500'
    }
  }
  
  // Mark reminder as complete
  const handleCompleteReminder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // In a real implementation, this would call an API to update the reminder
    console.log(`Marking reminder ${id} as complete`)
    // After API call, refresh the data
    await refreshData()
  }
  
  // Delete reminder
  const handleDeleteReminder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // In a real implementation, this would call an API to delete the reminder
    console.log(`Deleting reminder ${id}`)
    // After API call, refresh the data
    await refreshData()
  }
  
  return (
    <ProgressiveCard
      title="Reminders"
      icon={<Bell className="h-5 w-5" />}
      color="[#FF9800]"
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyState={emptyStateContent}
      actionButton={
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs border-orange-500/30 text-orange-400 hover:bg-orange-950/30"
          onClick={() => router.push('/reminders')}
        >
          View All
        </Button>
      }
    >
      <div className="space-y-2 p-2">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-400">Upcoming</h4>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-950/20 flex items-center gap-1"
            onClick={() => router.push('/reminders/new')}
          >
            <Plus className="h-3 w-3" />
            <span>Add</span>
          </Button>
        </div>
        
        <div className="space-y-2">
          {reminders.slice(0, 5).map((reminder) => (
            <div 
              key={reminder.id} 
              className={`
                p-3 bg-gray-800/50 rounded-md border border-gray-700 
                hover:border-orange-500/30 transition-colors cursor-pointer
                ${isPast(new Date(reminder.date)) && !reminder.completed ? 'border-red-500/30' : ''}
                ${reminder.completed ? 'opacity-60' : ''}
              `}
              onClick={() => setExpandedReminder(expandedReminder === reminder.id ? null : reminder.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`
                      h-5 w-5 p-0 rounded-full flex items-center justify-center
                      ${reminder.completed ? 'bg-green-900/20 text-green-500' : 'bg-gray-700 text-gray-400 hover:text-white'}
                    `}
                    onClick={(e) => handleCompleteReminder(reminder.id, e)}
                  >
                    {reminder.completed ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-current" />
                    )}
                  </Button>
                  
                  <div>
                    <h3 className={`font-medium ${reminder.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                      {reminder.title}
                    </h3>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center text-xs text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span className={isPast(new Date(reminder.date)) && !reminder.completed ? 'text-red-400' : ''}>
                          {formatReminderDate(reminder.date)}
                        </span>
                      </div>
                      
                      {reminder.time && (
                        <div className="flex items-center text-xs text-gray-400">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{reminder.time}</span>
                        </div>
                      )}
                      
                      {reminder.priority && (
                        <div className={`text-xs ${getPriorityColor(reminder.priority)}`}>
                          {reminder.priority}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-red-950/20"
                  onClick={(e) => handleDeleteReminder(reminder.id, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              
              {expandedReminder === reminder.id && reminder.description && (
                <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-300">
                  {reminder.description}
                </div>
              )}
            </div>
          ))}
          
          {reminders.length > 5 && (
            <div className="text-center text-sm text-gray-400 pt-2">
              +{reminders.length - 5} more reminders
            </div>
          )}
        </div>
      </div>
    </ProgressiveCard>
  )
} 
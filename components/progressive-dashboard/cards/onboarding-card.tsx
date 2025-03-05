"use client"

import React from 'react'
import { ProgressiveCard } from '../utils/progressive-card'
import { useData } from '../utils/data-provider'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { MapPin, Calendar, ClipboardList, Music, ShipWheel, Guitar } from 'lucide-react'
import Link from 'next/link'

export const OnboardingCard: React.FC = () => {
  const { hasData } = useData()
  const router = useRouter()
  
  // Define onboarding steps
  const steps = [
    {
      id: 'tour',
      title: 'Create Your First Tour',
      description: 'Start by creating a tour to organize your gigs and venues.',
      icon: <MapPin className="h-8 w-8 text-[#d83b34]" />,
      href: '/tours',
      completed: hasData.gigs
    },
    {
      id: 'gigs',
      title: 'Add Gigs to Your Tour',
      description: 'Schedule performances and manage your tour dates.',
      icon: <Calendar className="h-8 w-8 text-[#ff9920]" />,
      href: '/tours',
      completed: hasData.gigs
    },
    {
      id: 'venues',
      title: 'Save Venue Information',
      description: 'Keep track of venues you\'ve played or want to play.',
      icon: <MapPin className="h-8 w-8 text-[#00e396]" />,
      href: '/venues',
      completed: hasData.venues
    },
    {
      id: 'leads',
      title: 'Manage Your Leads',
      description: 'Track potential bookings and venue contacts.',
      icon: <ClipboardList className="h-8 w-8 text-[#d83b34]" />,
      href: '/leads',
      completed: hasData.leads
    },
    {
      id: 'setlists',
      title: 'Create Set Lists',
      description: 'Organize your songs for each performance.',
      icon: <Music className="h-8 w-8 text-[#008ffb]" />,
      href: '/setlist',
      completed: hasData.setLists
    },
    {
      id: 'riders',
      title: 'Prepare Your Riders',
      description: 'Document your technical and hospitality requirements.',
      icon: <ShipWheel className="h-8 w-8 text-[#008ffb]" />,
      href: '/riders',
      completed: hasData.riders
    },
    {
      id: 'stageplots',
      title: 'Design Stage Plots',
      description: 'Create visual layouts for your stage setup.',
      icon: <Guitar className="h-8 w-8 text-[#ff9920]" />,
      href: '/stage-plot',
      completed: hasData.stagePlots
    }
  ]
  
  // Find the next incomplete step
  const nextStep = steps.find(step => !step.completed)
  
  // Calculate progress
  const completedSteps = steps.filter(step => step.completed).length
  const progress = Math.round((completedSteps / steps.length) * 100)
  
  return (
    <ProgressiveCard
      title="Welcome to Band Practice"
      color="[#008ffb]"
      className="p-4"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">
            {completedSteps === 0 
              ? "Let's get started with your band's dashboard" 
              : `You've completed ${completedSteps} of ${steps.length} steps`}
          </h3>
          <div className="text-sm text-blue-400">
            {progress}% Complete
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Next step highlight */}
        {nextStep && (
          <div className="bg-[#1B2559] p-4 rounded-lg border border-blue-500/30 shadow-lg shadow-blue-500/10">
            <div className="flex items-start gap-4">
              <div className="mt-1">{nextStep.icon}</div>
              <div className="flex-1">
                <h4 className="text-lg font-medium text-white">
                  Next Step: {nextStep.title}
                </h4>
                <p className="text-gray-400 mt-1">
                  {nextStep.description}
                </p>
                <Button 
                  className="mt-3 bg-blue-600 hover:bg-blue-700"
                  onClick={() => router.push(nextStep.href)}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* All steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {steps.map((step, index) => (
            <Link 
              href={step.href}
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ${
                step.completed 
                  ? 'bg-green-900/20 border border-green-500/30' 
                  : 'bg-[#1A2652] hover:bg-[#242f6a] border border-slate-700'
              }`}
            >
              <div className="mt-1">
                {step.icon}
              </div>
              <div>
                <h4 className={`font-medium ${step.completed ? 'text-green-400' : 'text-white'}`}>
                  {step.title}
                  {step.completed && (
                    <span className="ml-2 text-xs bg-green-700 text-white px-2 py-0.5 rounded-full">
                      Completed
                    </span>
                  )}
                </h4>
                <p className="text-sm text-gray-400 mt-1">
                  {step.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ProgressiveCard>
  )
} 
"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { PlusCircle, Trash2, Edit, Clock, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Lead {
  id: string;
  venueId: string;
  venueName: string;
  status: 'new_lead' | 'initial_contact' | 'negotiating' | 'pending_confirmation' | 'converted_to_gig' | 'archived';
  priority: 'high' | 'medium' | 'low';
  lastContactDate: Date;
  nextFollowUp?: Date;
  notes: string[];
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  potentialDates?: Date[];
}

const mockLeads: Lead[] = [
  {
    id: '1',
    venueId: 'venue-1',
    venueName: "The Fillmore",
    status: 'initial_contact',
    priority: 'high',
    lastContactDate: new Date(),
    notes: ['Initial email sent', 'Waiting for response about dates'],
    contactName: 'John Smith',
    contactEmail: 'john@fillmore.com',
    contactPhone: '555-0123'
  },
  // Add more mock leads
];

export default function LeadManagement() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  React.useEffect(() => {
    setIsLoaded(true);
  }, []);

  const cardHoverClass = isLoaded
    ? "transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-md hover:shadow-green-400/50"
    : "";

  return (
    <div className="pl-4 pt-3 bg-[#0f1729] text-white min-h-screen">
      <h1 className="text-4xl font-mono mb-4">
        <span className="text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          AI Lead Management
        </span>
      </h1>
      <div className="border-[#ff9920] border-b-2 -mt-8 mb-4 w-[100%] h-4"></div>
      
      <div className="pr-6 pl-8 pb-6 pt-4 bg-[#131d43] text-white min-h-[500px] shadow-sm shadow-green-400 rounded-md border-blue-800 border">
        {!isFormVisible ? (
          <>
            <Button 
              onClick={() => {
                setCurrentLead(null);
                setIsFormVisible(true);
              }}
              className="mb-4 bg-green-700 text-white hover:bg-green-600 float-right"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Lead
            </Button>
            
            <ScrollArea className="h-[600px] pr-4 clear-both">
              <AnimatePresence>
                {leads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.01 }}
                    exit={{ opacity: 0, x: 0 }}
                    className={`bg-[#1B2559] border-blue-800 border p-4 rounded-md mb-4 relative ${cardHoverClass}`}
                  >
                    {/* Lead card content */}
                    <div className="absolute top-2 right-2 space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setCurrentLead(lead);
                        setIsFormVisible(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2">{lead.venueName}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-400">Status</p>
                        <p className="text-md">{lead.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Priority</p>
                        <p className="text-md">{lead.priority}</p>
                      </div>
                    </div>
                    
                    {/* Continue with more lead details */}
                  </motion.div>
                ))}
              </AnimatePresence>
            </ScrollArea>
          </>
        ) : (
          // Form component here
          <div>
            {/* Lead form implementation */}
          </div>
        )}
      </div>
    </div>
  );
} 
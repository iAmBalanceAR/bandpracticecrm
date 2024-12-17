"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, Search, Trash2, Edit } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  capacity?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// Mock data
const mockVenues: Venue[] = [
  {
    id: '1',
    name: 'The Fillmore',
    address: '1805 Geary Blvd',
    city: 'San Francisco',
    state: 'CA',
    capacity: 1150,
    contactName: 'John Smith',
    contactEmail: 'john@fillmore.com',
    contactPhone: '555-0123'
  },
  // Add more mock venues as needed
];

export default function VenueManagement() {
  const [venues, setVenues] = useState<Venue[]>(mockVenues);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
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
          Venue Database Search
        </span>
      </h1>
      <div className="border-[#ff9920] border-b-2 -mt-8 mb-4 w-[100%] h-4"></div>
      
      <div className="pr-6 pl-8 pb-6 pt-4 bg-[#131d43] text-white min-h-[500px] shadow-sm shadow-green-400 rounded-md border-blue-800 border">
        <div className="flex justify-between items-center mb-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-[#1B2559]"
            />
          </div>
          <Button 
            onClick={() => setIsFormVisible(true)}
            className="ml-4 bg-green-700 text-white hover:bg-green-600"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Venue
          </Button>
        </div>

        <ScrollArea className="h-[600px]">
          <AnimatePresence>
            {venues.map((venue) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.01 }}
                exit={{ opacity: 0, x: 0 }}
                className={`bg-[#1B2559] border-blue-800 border p-4 rounded-md mb-4 relative ${cardHoverClass}`}
              >
                <div className="absolute top-2 right-2 space-x-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{venue.name}</h3>
                <p className="text-gray-300">{venue.address}</p>
                <p className="text-gray-300">{venue.city}, {venue.state}</p>
                {venue.capacity && (
                  <p className="text-gray-400 mt-2">Capacity: {venue.capacity}</p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </ScrollArea>
      </div>
    </div>
  );
} 
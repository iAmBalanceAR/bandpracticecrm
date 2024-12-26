"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, Search, Trash2, Edit, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Venue } from '@/app/types/venue'
import { DataTable } from '@/components/ui/data-table'
import type { ColumnDef, Table as TableType, Row } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface VenueManagementProps {
  initialVenues: Venue[];
}

export default function VenueManagement({ initialVenues }: VenueManagementProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [venues, setVenues] = useState<Venue[]>(initialVenues)
  const [selectedVenues, setSelectedVenues] = useState<string[]>([])

  const columns: ColumnDef<Venue>[] = [
    {
      id: 'select',
      header: ({ table }: { table: TableType<Venue> }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onClick={(e) => table.toggleAllPageRowsSelected(!!e.currentTarget.checked)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: { row: Row<Venue> }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onClick={(e) => row.toggleSelected(!!e.currentTarget.checked)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'title',
      header: 'Venue Name',
      cell: ({ row }: { row: Row<Venue> }) => (
        <Link 
          href={`/venues/${row.original.id}`}
          className="font-medium hover:text-blue-400 transition-colors"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: 'city',
      header: 'City',
    },
    {
      accessorKey: 'state',
      header: 'State',
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }: { row: Row<Venue> }) => {
        const status = row.original.verified ? 'verified' : 'pending'
        return (
          <Badge variant={status === 'verified' ? 'success' : 'warning'}>
            {status}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }: { row: Row<Venue> }) => {
        const venue = row.original
  return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/venues/${venue.id}/edit`)}
            >
              Edit
            </Button>
          <Button 
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700"
              onClick={() => handleDeleteVenue(venue.id)}
            >
              Delete
          </Button>
        </div>
        )
      },
    },
  ]

  const handleDeleteVenue = async (venueId: string) => {
    try {
      const response = await fetch(`/api/venues/${venueId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete venue')

      setVenues(venues.filter(venue => venue.id !== venueId))

      toast({
        title: 'Success',
        description: 'Venue deleted successfully',
      })

      router.refresh()
    } catch (error) {
      console.error('Error deleting venue:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete venue. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedVenues.length) return

    try {
      const response = await fetch('/api/venues/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ venue_ids: selectedVenues }),
      })

      if (!response.ok) throw new Error('Failed to delete venues')

      setVenues(venues.filter(venue => !selectedVenues.includes(venue.id)))
      setSelectedVenues([])

      toast({
        title: 'Success',
        description: `${selectedVenues.length} venues deleted successfully`,
      })

      router.refresh()
    } catch (error) {
      console.error('Error deleting venues:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete venues. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-[#131d43] border-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Venues</CardTitle>
          <div className="flex gap-2">
            {selectedVenues.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                Delete Selected ({selectedVenues.length})
                  </Button>
            )}
            <Button
              onClick={() => router.push('/venues/new')}
              className="bg-green-700 text-white hover:bg-green-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Venue
                  </Button>
                </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={venues}
            onRowSelectionChange={setSelectedVenues}
          />
        </CardContent>
      </Card>
    </div>
  )
} 
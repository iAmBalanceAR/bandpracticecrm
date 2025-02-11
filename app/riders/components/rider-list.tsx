"use client"

import { RiderListProps } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2, Pencil, ShipWheel, Check, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function RiderList({
  type,
  riders,
  onSelect,
  onDelete,
  isLoading = false
}: RiderListProps) {

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (riders.length === 0) {
    return (
      <Card className="bg-[#111C44] border-none">
        <CardContent className="pt-6">
        <div className="text-center py-8">
          <ShipWheel  className="w-24 h-24 mx-auto mb-4 text-blue-500" />
          <p className="text-md text-gray-400">
            No {type} riders found. Create one to get started.
          </p>
        </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border-gray-500 border-2 rounded-lg">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="text-lg font-medium bg-[#1F2937] text-gray-100 text-shadow-x-2 text-shadow-y-2 text-shadow-black border-gray-500 border-b-1">
              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Title</TableHead>
            <TableHead  className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Last Updated</TableHead>
            <TableHead  className="text-gray-100 bg-[#1F2937] pt-4 pb-4 text-center">Type</TableHead>
            {type === 'technical' && (
              <>
                <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4 mx-auto text-center">Stage Plot</TableHead>
                <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4 mx-auto text-center">Set List</TableHead>
              </>
            )}
            <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4 mx-auto text-center">Gig</TableHead>
            <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {riders.map((rider) => (
           <TableRow 
              className="bg-[#111827] hover:bg-[#030817] transition-colors border-gray-500 border-b text-base"
              key={rider.id}
              onClick={() => onSelect && onSelect(rider)}
            >
              <TableCell className="text-xl text-gray-400">
                {rider.title}
              </TableCell>
              <TableCell className="text-gray-400">
                {new Date(rider.updated_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-center text-gray-400">
              
                {rider.type === 'technical' && (
                  <span className="inline-flex items-center rounded-md bg-lime-400 px-2 py-1 text-smm font-medium text-slate-700 ring-1 ring-inset ring-blue-400/30">
                    Technical
                  </span>
                )}
                {rider.type === 'hospitality' && (
                  <span className="inline-flex items-center rounded-md bg-yellow-400 px-2 py-1 text-sm font-medium text-slate-700 ring-1 ring-inset ring-blue-400/30">
                    Hospitality
                  </span>
                )}
              </TableCell>
              {type === 'technical' && (
                <>
                  <TableCell className="text-center text-2xl text-gray-400">
                    {rider.stage_plot_id !== null ? <Check className="w-6 h-6 text-green-500 mx-auto" /> : <X className="w-6 h-6 text-red-500 mx-auto" />}
                  </TableCell>
                  <TableCell className="text-center text-2xl text-gray-400">
                    {rider.setlist_id !== null ? <Check className="w-6 h-6 text-green-500 mx-auto" /> : <X className="w-6 h-6 text-red-500 mx-auto" />}
                  </TableCell>
                </>
              )}
              <TableCell className="text-center text-lg text-gray-400">
                {rider.gig_id !== null ? <Check className="w-6 h-6 text-green-500 mx-auto" /> : <X className="w-6 h-6 text-red-500 mx-auto" />}
              </TableCell>
              <TableCell className="text-center mx-auto text-2xl text-gray-400">
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect && onSelect(rider)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(rider)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
</div>
  )
} 
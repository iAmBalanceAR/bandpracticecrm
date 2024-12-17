"use client"

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { File, Image, Music, Video, FileText, Trash2, ChevronDown, Upload, Search, X } from 'lucide-react'

interface FileData {
  id: string
  name: string
  path: string
  type: string
  size: number
  uploadedBy: string
  uploadDate: Date
}

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'image':
      return <Image className="w-5 h-5" />
    case 'audio':
      return <Music className="w-5 h-5" />
    case 'video':
      return <Video className="w-5 h-5" />
    case 'document':
      return <FileText className="w-5 h-5" />
    default:
      return <File className="w-5 h-5" />
  }
}

const getFileType = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension!)) return 'image'
  if (['mp3', 'wav', 'ogg'].includes(extension!)) return 'audio'
  if (['mp4', 'avi', 'mov'].includes(extension!)) return 'video'
  if (['doc', 'docx', 'pdf', 'txt'].includes(extension!)) return 'document'
  return 'other'
}

const initialFiles: FileData[] = [
  { id: '1', name: 'band_logo.png', path: '/uploads/band_logo.png', type: 'image', size: 1024 * 50, uploadedBy: 'J. Haynie', uploadDate: new Date('2024-03-15T10:30:00') },
  { id: '2', name: 'setlist.docx', path: '/uploads/setlist.docx', type: 'document', size: 1024 * 25, uploadedBy: 'M. Smith', uploadDate: new Date('2024-03-16T14:45:00') },
  { id: '3', name: 'new_song.mp3', path: '/uploads/new_song.mp3', type: 'audio', size: 1024 * 1024 * 5, uploadedBy: 'J. Haynie', uploadDate: new Date('2024-03-17T09:15:00') },
  { id: '4', name: 'practice_session.mp4', path: '/uploads/practice_session.mp4', type: 'video', size: 1024 * 1024 * 100, uploadedBy: 'L. Johnson', uploadDate: new Date('2024-03-18T16:20:00') },
  { id: '5', name: 'lyrics.txt', path: '/uploads/lyrics.txt', type: 'document', size: 1024 * 2, uploadedBy: 'J. Haynie', uploadDate: new Date('2024-03-19T11:00:00') },
]

export default function FileUploadAdmin() {
  const [files, setFiles] = useState<FileData[]>(initialFiles)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<keyof FileData>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterType, setFilterType] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      path: `/uploads/${file.name}`,
      type: getFileType(file.name),
      size: file.size,
      uploadedBy: 'J. Haynie',
      uploadDate: new Date(),
    }))
    setFiles(prevFiles => [...prevFiles, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const handleSort = (column: keyof FileData) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleDelete = (id: string) => {
    setFiles(files.filter(file => file.id !== id))
  }

  const filteredAndSortedFiles = files
    .filter(file => 
      (filterType ? file.type === filterType : true) &&
      (file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       file.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
       file.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1
      if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  return (
  <div className="pl-4 pt-3 bg-[#0f1729] text-white min-h-screen">
    <h1 className="text-4xl font-mono mb-4">
        <span className="w-[100%]  text-white text-shadow-smfont-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
        Files and Images Upload Admin
        </span>
      </h1>
      <div className="border-[#ff9920] border-b-2 -mt-8 mb-4 w-[100%] h-4"></div>
      <Card className="bg-[#131d43]">
      <CardHeader>
        <CardTitle className="text-2xl">
          <h1 className="font-mono text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
            File(s) Manager
          </h1>
          </CardTitle>
      </CardHeader>
      <CardContent>
        <div {...getRootProps()} className="text-white border-2 border-dashed border-gray-600 rounded-lg p-8 mb-4 text-center cursor-pointer hover:border-green-400 transition-colors">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <div>
              <Upload className="mx-auto w-12 h-12 text-gray-400 mb-2" />
              <p>Drag 'n' drop some files here, or click to select files</p>
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center space-x-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-[#2D3748] border-[#4A5568] text-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-[#2D3748] border-[#4A5568] text-white">
                {filterType ? `Filter: ${filterType}` : 'Filter'} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#2D3748] border-[#4A5568] text-white">
              <DropdownMenuItem onClick={() => setFilterType(null)}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('image')}>Images</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('audio')}>Audio</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('video')}>Video</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('document')}>Documents</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('other')}>Other</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full border-l border-r border-b border-[#4A5568] text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
            <TableHeader>
              <TableRow className="bg-black hover:bg-[#1E293B] text-white text-shadow-lg -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
                <TableHead onClick={() => handleSort('name')} className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">
                  File Name {sortColumn === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                </TableHead>
                <TableHead onClick={() => handleSort('type')} className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">
                  Type {sortColumn === 'type' && (sortDirection === 'asc' ? '▲' : '▼')}
                </TableHead>
                <TableHead onClick={() => handleSort('size')} className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">
                  Size {sortColumn === 'size' && (sortDirection === 'asc' ? '▲' : '▼')}
                </TableHead>
                <TableHead onClick={() => handleSort('uploadedBy')} className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">
                  Uploaded By {sortColumn === 'uploadedBy' && (sortDirection === 'asc' ? '▲' : '▼')}
                </TableHead>
                <TableHead onClick={() => handleSort('uploadDate')} className="cursor-pointer text-white border-t border-b border-[#4A5568] text-center">
                  Upload Date {sortColumn === 'uploadDate' && (sortDirection === 'asc' ? '▲' : '▼')}
                </TableHead>
                <TableHead className="text-white border-t border-b border-[#4A5568] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedFiles.map((file) => (
                <TableRow key={file.id} className="hover:bg-black border-b border-[#4A5568]">
                  <TableCell className="font-medium text-gray-200 py-2">
                    <div className="flex items-center">
                      {getFileIcon(file.type)}
                      <span className="ml-2">{file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-200 py-2">{file.type}</TableCell>
                  <TableCell className="text-gray-200 py-2">{(file.size / 1024 / 1024).toFixed(2)} MB</TableCell>
                  <TableCell className="text-gray-200 py-2">{file.uploadedBy}</TableCell>
                  <TableCell className="text-gray-200 py-2">
                    {format(file.uploadDate, 'MMM d, yyyy')} at {format(file.uploadDate, 'h:mm a')}
                  </TableCell>
                  <TableCell className="py-2">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(file.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
  )
}
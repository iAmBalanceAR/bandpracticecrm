'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import createClient from '@/utils/supabase/client'
import Image from 'next/image'

interface ImageUploadProps {
  currentImageUrl: string | null
  onImageUploaded: (url: string) => void
  userId: string
  disabled?: boolean
}

export function ImageUpload({ currentImageUrl, onImageUploaded, userId, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentImageUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const processImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Set maximum dimensions
        const MAX_WIDTH = 500
        const MAX_HEIGHT = 500

        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to process image'))
              return
            }
            // Create new file with processed image
            const processedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(processedFile)
          },
          'image/jpeg',
          0.8 // compression quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      // Process image
      const processedFile = await processImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(processedFile)

      // Generate unique filename with timestamp and user ID
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `user_${userId}_${timestamp}.${fileExt}`
      const filePath = `user-images/${fileName}`

      // Delete old image if exists
      if (currentImageUrl) {
        const oldPath = currentImageUrl.split('/').pop()
        if (oldPath) {
          await supabase.storage.from('user-images').remove([oldPath])
        }
      }

      // Upload new image
      const { error: uploadError, data } = await supabase.storage
        .from('user-images')
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(filePath)

      onImageUploaded(publicUrl)
    } catch (err: any) {
      setError(err.message)
      setPreview(currentImageUrl)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return

    setIsUploading(true)
    try {
      const oldPath = currentImageUrl.split('/').pop()
      if (oldPath) {
        await supabase.storage.from('user-images').remove([oldPath])
      }
      setPreview(null)
      onImageUploaded('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-[#1B2559] border border-blue-800">
          {preview ? (
            <Image
              src={preview}
              alt="Profile preview"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="bg-[#1B2559] border-blue-800 text-white hover:bg-[#242f6a]"
          >
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemoveImage}
              disabled={disabled || isUploading}
              className="bg-red-900 hover:bg-red-800"
            >
              Remove Image
            </Button>
          )}
        </div>
      </div>
      {error && (
        <Alert variant="destructive" className="bg-red-900 border-red-600">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
} 
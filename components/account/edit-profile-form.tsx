'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import createClient from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { X } from 'lucide-react'
import { ImageUpload } from '@/components/account/image-upload'
import type { Database } from '@/types/supabase'
import { Loader2 } from 'lucide-react'

interface EditProfileFormProps {
  user: any
  isOpen: boolean
  onClose: () => void
}

export default function EditProfileForm({ user, isOpen, onClose }: EditProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      setFullName(user?.user_metadata?.full_name || '')
      setAvatarUrl(user?.user_metadata?.avatar_url || '')
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: avatarUrl,
        }
      })

      if (updateError) throw updateError

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id)

      if (profileError) throw profileError

      setSuccess(true)
      onClose()
      
      // Add a small delay before reloading to show the success message
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUploaded = (url: string) => {
    setAvatarUrl(url)
  }

  if (!user) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-[#111c44] text-white border border-blue-900 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-blue-900 bg-[#0f1729] flex items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-white"><span className="text-shadow-blur-4 text-shadow-black text-shadow-sm  text-shadow-x-2 text-shadow-y-2">Edit Profile</span></DialogTitle>

        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-900/50 border border-red-700 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-900/50 border border-green-700 text-green-200">
              <AlertDescription>Profile updated successfully! Redirecting...</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-300"><span className="text-shadow-blur-4 text-shadow-black text-shadow-sm  text-shadow-x-2 text-shadow-y-2">Email</span></Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-[#030817] border-blue-900 text-gray-400 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-300"><span className="text-shadow-blur-4 text-shadow-black text-shadow-sm  text-shadow-x-2 text-shadow-y-2">Full Name</span></Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="bg-[#1B2559] border-blue-900 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300"><span className="text-shadow-blur-4 text-shadow-black text-shadow-sm  text-shadow-x-2 text-shadow-y-2">Profile Image</span></Label>
            <div className="bg-[#0f1729] border border-blue-900 rounded-lg p-4">
              <ImageUpload
                currentImageUrl={avatarUrl}
                onImageUploaded={handleImageUploaded}
                userId={user.id}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-blue-900 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-white bg-red-600 hover:bg-red-700 border-black border"
              disabled={loading}
            >
              <span className="text-shadow-blur-4 text-shadow-black text-shadow-sm  text-shadow-x-2 text-shadow-y-2">Cancel</span>
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white border-black border"
              disabled={loading}
            >
              <span className="text-shadow-blur-4 text-shadow-black text-shadow-sm  text-shadow-x-2 text-shadow-y-2">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
              </span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
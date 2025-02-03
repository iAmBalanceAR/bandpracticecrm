'use client'

import { useState } from 'react'
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
import type { Database } from '@/types/supabase'

interface ChangePasswordFormProps {
  isOpen: boolean
  onClose: () => void
  resetCode?: string
}

export default function ChangePasswordForm({ isOpen, onClose, resetCode }: ChangePasswordFormProps) {
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setLoading(false)
      return
    }

    try {
      if (resetCode) {
        // Handle password reset with code
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        })
        if (updateError) throw updateError
      } else {
        // Handle normal password change
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        })
        if (updateError) throw updateError
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#111c44] text-white border-0 rounded-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white mt-6 ml-6">
            {resetCode ? 'Reset Password' : 'Change Password'}
          </DialogTitle>
          <Button
            variant="ghost"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <Alert variant="destructive" className="bg-red-900 border-red-600">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-900 border-green-600">
              <AlertDescription>Password updated successfully</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#111c44] border focus:border-white border-gray-400 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-[#111c44] border focus:border-white border-gray-400 text-white"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white hover:bg-green-800"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
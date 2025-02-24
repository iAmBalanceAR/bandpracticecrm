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
  DialogTitle,
} from "@/components/ui/dialog"
import { X, Loader2 } from 'lucide-react'
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
      <DialogContent className="sm:max-w-[500px] p-0 bg-[#111c44] text-white border border-blue-900 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-blue-900 bg-[#0f1729] flex items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-white">
          <span className="text-shadow-blur-4 text-shadow-black text-shadow-sm  text-shadow-x-2 text-shadow-y-2">{resetCode ? 'Reset Password' : 'Change Password'}</span>
          </DialogTitle>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-900/50 border border-red-700 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-900/50 border border-green-700 text-green-200">
              <AlertDescription>Password updated successfully</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-300"><span className="text-shadow-blur-4 text-shadow-black text-shadow-sm  text-shadow-x-2 text-shadow-y-2">New Password</span></Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#1B2559] border-blue-900 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter new password"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300"><span className="text-shadow-blur-4 text-shadow-black text-shadow-sm  text-shadow-x-2 text-shadow-y-2">Confirm New Password</span></Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-[#1B2559] border-blue-900 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm new password"
              required
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-blue-900 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className=" text-shadow-blur-4 text-shadow-black text-shadow-sm  text-shadow-x-2 text-shadow-y-2 bg-red-600 text-white hover:bg-red-700 border-black border"
              disabled={loading}
            >
              <span className="text-shadow-blur-4 text-shadow-black text-shadow-sm  text-shadow-x-2 text-shadow-y-2">Cancel</span>
            </Button>
            <Button
              type="submit"
              className=" bg-green-600 hover:bg-green-700 text-white border-black border"
              disabled={loading}>
              <span className="text-shadow-blur-4 text-shadow-black text-shadow-sm  text-shadow-x-2 text-shadow-y-2">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
              </span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
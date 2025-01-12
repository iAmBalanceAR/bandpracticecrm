'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function ResendVerification() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null
    message: string | null
  }>({ type: null, message: null })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: null, message: null })

    try {
      const response = await fetch('/api/admin/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email')
      }

      setStatus({
        type: 'success',
        message: 'Verification email sent successfully'
      })
      setEmail('')
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-[#1B2559] rounded-lg shadow-lg border border-blue-600">
      <h2 className="text-xl font-semibold text-white mb-4">Resend Verification Email</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter user's email"
            required
            className="bg-[#111c44] w-full rounded-md p-1.5 text-white focus:border-white border-gray-400 border placeholder:text-gray-300"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 text-white hover:bg-green-800"
        >
          {loading ? 'Sending...' : 'Send Verification Email'}
        </Button>

        {status.message && (
          <Alert variant={status.type === 'success' ? 'default' : 'destructive'} 
                className={status.type === 'success' ? 'bg-green-900 border-green-600' : 'bg-red-900 border-red-600'}>
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  )
} 
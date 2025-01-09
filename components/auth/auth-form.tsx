'use client'

import React from 'react'
import { useState } from 'react'
import createClient from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'
import { FeedbackModal } from '@/components/ui/feedback-modal'

type FeedbackModalState = {
  isOpen: boolean
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'delete'
}

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  })
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setFeedbackModal({
          isOpen: true,
          title: 'Sign In Error',
          message: error.message,
          type: 'error'
        })
        return
      }

      if (data?.session) {
        router.push('/account')
      }
    } catch (error: any) {
      setFeedbackModal({
        isOpen: true,
        title: 'Sign In Error',
        message: error.message || 'An unexpected error occurred',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[500px]">
        <div className="bg-[#1B2559] px-0 py-0 pb-12 mb-4 shadow sm:rounded-lg sm:px-4 border-blue-600 border">
          <h1 className="text-[#43A7C5] text-center font-semibold font-mono text-3xl mb-4 mt-4">
            Sign In
          </h1>
          <form className="space-y-6" onSubmit={handleSignIn}>
            <div className="">
              <Label htmlFor="email" />
              <div className="mt-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder='Enter Your Email Address...'
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#111c44] w-full rounded-md p-1.5 text-white focus:border-white border-gray-400 border placeholder:text-gray-300 sm:textmd m sm:leading-6 py-6"
                />
              </div>
            </div>

            <div className="">
              <Label htmlFor="password" />
              <div className="mb-4 mt-2">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder='Enter Your Password...'
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#111c44] w-full rounded-md p-1.5 text-white focus:border-white border-gray-400 border placeholder:text-gray-300 sm:textmd m sm:leading-0 py-6"
                />
              </div>
            </div>

            <div className="flex-auto flex justify-center">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 font-semibold text-white shadow-sm hover:bg-green-800 focus-visible:outline outline-black p-6"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
      />
    </div>
  )
} 
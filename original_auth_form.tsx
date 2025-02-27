'use client'

import React, { useState, useEffect, useRef } from 'react'
import createClient from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'
import { FeedbackModal } from '@/components/ui/feedback-modal'
import ReCAPTCHA from 'react-google-recaptcha'

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
  const [isPasswordReset, setIsPasswordReset] = useState(false)
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const error = searchParams.get('error')
    const error_code = searchParams.get('error_code')
    const error_description = searchParams.get('error_description')
    const message = searchParams.get('message')

    // Handle password reset success
    if (message?.includes('Password updated successfully')) {
      setFeedbackModal({
        isOpen: true,
        title: 'Password Updated',
        message: 'Your password has been successfully updated. You can now sign in with your new password.',
        type: 'success'
      })
    }

    // Handle invalid/expired reset code
    if (error) {
      let title = 'Error'
      let message = error_description || 'An error occurred'

      // Set specific titles based on error type
      if (error === 'access_denied' || error === 'reset_code_invalid' || error_code === 'otp_expired') {
        title = 'Invalid or Expired Link'
        message = 'The password reset link is invalid or has expired. Please request a new password reset link.'
      } else if (error === 'no_session') {
        title = 'Session Error'
        message = 'Unable to establish a session. Please try again.'
      }

      setFeedbackModal({
        isOpen: true,
        title,
        message,
        type: 'error'
      })
    }
  }, [])

  const verifyRecaptcha = async (token: string | null) => {
    if (!token) return false;
    
    try {
      const response = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('reCAPTCHA verification failed:', error);
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const token = recaptchaRef.current?.getValue()
    if (!token) {
      setFeedbackModal({
        isOpen: true,
        title: 'Verification Required',
        message: 'Please check the reCAPTCHA box before proceeding.',
        type: 'error'
      })
      return
    }

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
        setLoading(false)
        return
      }

      if (data?.session) {
        router.push('/account')
        return
      }
    } catch (error: any) {
      setFeedbackModal({
        isOpen: true,
        title: 'Sign In Error',
        message: error.message || 'An unexpected error occurred',
        type: 'error'
      })
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setFeedbackModal({
        isOpen: true,
        title: 'Email Required',
        message: 'Please enter your email address first.',
        type: 'error'
      })
      return
    }

    const token = recaptchaRef.current?.getValue()
    if (!token) {
      setFeedbackModal({
        isOpen: true,
        title: 'Verification Required',
        message: 'Please check the reCAPTCHA box before proceeding.',
        type: 'error'
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (error) throw error

      setFeedbackModal({
        isOpen: true,
        title: 'Check Your Email',
        message: 'If an account exists with this email, you will receive password reset instructions.',
        type: 'success'
      })
      setIsPasswordReset(false) // Switch back to sign in form
    } catch (error: any) {
      setFeedbackModal({
        isOpen: true,
        title: 'Reset Password Error',
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
            {isPasswordReset ? 'Reset Password' : 'Sign In'}
          </h1>
          
          {isPasswordReset ? (
            <form className="space-y-6" onSubmit={handleForgotPassword}>
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

              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                theme="dark"
                hl="en"
                badge="inline"
                type="image"
              />

              <div className="flex-auto flex justify-center">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-700 font-semibold text-white shadow-sm hover:bg-green-800 focus-visible:outline outline-black p-6"
                >
                  {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                </Button>
              </div>
            </form>
          ) : (
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

              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                theme="dark"
                hl="en"
                badge="inline"
                type="image"
                className="flex justify-center"
              />

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
          )}

          <div className="text-white text-xs text-grey-200 w-full mt-2 justify-center items-center flex mb-0">
            Password must be at least 6 characters.
            <span className="mx-2">|</span>
            <button
              type="button"
              onClick={() => setIsPasswordReset(!isPasswordReset)}
              className="text-blue-400 hover:text-blue-500 hover:underline focus:outline-none"
            >
              {isPasswordReset ? 'Back to Sign In' : 'Forgot Password?'}
            </button>
          </div>
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
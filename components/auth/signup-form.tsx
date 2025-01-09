'use client'

import React from 'react'
import { useState, useRef } from 'react'
import createClient from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'
import { AuthError } from '@supabase/supabase-js'
import ReCAPTCHA from 'react-google-recaptcha'
import { FeedbackModal } from '@/components/ui/feedback-modal'
import { normalizeEmail, isEmailAvailable } from '@/utils/email-validator'

type FeedbackModalState = {
  isOpen: boolean
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'delete'
}

export function SignUpForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  })
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Normalize email (handles Gmail dots and plus addressing)
    const normalizedEmail = normalizeEmail(email)

    // Verify reCAPTCHA
    const recaptchaValue = recaptchaRef.current?.getValue()
    if (!recaptchaValue) {
      setFeedbackModal({
        isOpen: true,
        title: 'Verification Required',
        message: 'Please complete the CAPTCHA verification',
        type: 'error'
      })
      setLoading(false)
      return
    }

    // Verify CAPTCHA server-side
    try {
      const verifyResponse = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: recaptchaValue }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyData.success) {
        setFeedbackModal({
          isOpen: true,
          title: 'Verification Failed',
          message: 'CAPTCHA verification failed. Please try again.',
          type: 'error'
        })
        setLoading(false)
        return
      }
    } catch (error) {
      setFeedbackModal({
        isOpen: true,
        title: 'Verification Error',
        message: 'Failed to verify CAPTCHA. Please try again.',
        type: 'error'
      })
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setFeedbackModal({
        isOpen: true,
        title: 'Password Mismatch',
        message: 'Passwords do not match',
        type: 'error'
      })
      setLoading(false)
      return
    }
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`
        }
      })

      if (signUpError) {
        setFeedbackModal({
          isOpen: true,
          title: 'Registration Error',
          message: signUpError.message,
          type: 'error'
        })
        setLoading(false)
        return
      }

      // Check if this is a dummy user (indicating email exists)
      if (data?.user && data.user.identities?.length === 0) {
        setFeedbackModal({
          isOpen: true,
          title: 'Account Exists',
          message: 'This email address is already registered. Please sign in instead.',
          type: 'error'
        })
        setLoading(false)
        return
      }

      if (data?.user) {
        if (data.session === null) {
          setFeedbackModal({
            isOpen: true,
            title: 'Check Your Email!d',
            message: 'Check your email and verify via the provided link. Welcome to Band Practice!.',
            type: 'success'
          })
          setLoading(false)
          return
        }
        router.push('/account')
      } else {
        setFeedbackModal({
          isOpen: true,
          title: 'Registration Error',
          message: 'Something went wrong. Please try again.',
          type: 'error'
        })
      }
    } catch (error: any) {
      setFeedbackModal({
        isOpen: true,
        title: 'Registration Error',
        message: error.message || 'An unexpected error occurred',
        type: 'error'
      })
    } finally {
      setLoading(false)
      recaptchaRef.current?.reset()
    }
  }

  const handleFeedbackClose = () => {
    // If it was a success message, redirect to login
    if (feedbackModal.type === 'success') {
      router.push('/auth/signin')
    }
    setFeedbackModal(prev => ({ ...prev, isOpen: false }))
  }

  return (
    <div className="">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[500px]">
        <div className="bg-[#1B2559] px-0 py-0 pb-0 mt-4 shadow sm:rounded-lg sm:px-4 border-blue-600 border">   
          <h1 className="text-[#43A7C5] text-center font-semibold font-mono text-3xl mb-4 mt-4">
            Create Your Account
          </h1>
          <form className="space-y-6" onSubmit={handleRegister}>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid col-span-1 h-full">
                <div className="mb-">
                  <Label htmlFor="firstName" />
                  <div className="mt-0">
                    <Input
                      id="firstName"
                      placeholder='Enter Your First Name...'
                      name="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-[#111c44] w-full rounded-md p-1.5 text-white focus:border-white border-gray-400 border placeholder:text-gray-300 sm:text-md sm:leading-6 py-6"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <Label htmlFor="lastName" />
                  <div>
                    <Input
                      id="lastName"
                      placeholder='Enter Your Last Name...'
                      name="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-[#111c44] w-full rounded-md p-1.5 text-white focus:border-white border-gray-400 border placeholder:text-gray-300 sm:textmd m sm:leading-0 py-6"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <Label htmlFor="email" />
                  <div className="">
                    <Input
                      id="email"
                      placeholder='Enter Your Email Address...'
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-[#111c44] w-full rounded-md p-1.5 text-white focus:border-white border-gray-400 border placeholder:text-gray-300 sm:textmd m sm:leading-6 py-6"
                    />
                  </div>
                </div>
              </div>
              
              <div className="">
                <div className="mb-0">
                  <Label htmlFor="password"/>
                  <div className="mt-0">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder='Enter Password...'
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-[#111c44] w-full rounded-md p-1.5 text-white focus:border-white border-gray-400 border placeholder:text-gray-300 sm:textmd m sm:leading-0 py-6"
                    />
                  </div>
                </div>
                
                <div className="mt-2 mb-0">
                  <Label htmlFor="confirmPassword" />
                  <div className="mt-0">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder='Confirm Password...'
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-[#111c44] w-full rounded-md p-1.5 text-white focus:border-white border-gray-400 border placeholder:text-gray-300 sm:textmd m sm:leading-6 py-6"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid col-span-2 mb-0">
                {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
                  <div className="w-full flex justify-center items-center py-4">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                      theme="dark"
                    />
                  </div>
                ) : (
                  <Alert variant="destructive" className="bg-red-900 border-red-600 text-white">
                    <AlertDescription>ReCAPTCHA configuration is missing. Please contact support.</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="grid col-span-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="float-right bg-green-700 font-semibold text-white shadow-sm hover:bg-green-800 focus-visible:outline outline-black w-auto p-6"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </div>
          </form>
          <div className="text-white text-xs text-grey-200 w-full mt-2 justify-center items-center flex mb-4">
            Password must be at least 6 characters.
          </div>
        </div>
      </div>

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={handleFeedbackClose}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
      />
    </div>
  )
} 
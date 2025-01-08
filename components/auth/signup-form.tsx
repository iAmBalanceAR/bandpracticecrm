'use client'

import React from 'react'
import { useState } from 'react'
import createClient from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'
import { AuthError } from '@supabase/supabase-js'

export function SignUpForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      // Check if this is a dummy user (indicating email exists)
      if (data?.user && data.user.identities?.length === 0) {
        setError("This email address is already registered. Please sign in instead.")
        setLoading(false)
        return
      }

      if (data?.user) {
        if (data.session === null) {
          setError("One more step needed: Please check your email for a verification link. You must verify your email address before you can sign in.")
          return
        }
        router.push('/profile')
      } else {
        setError("Something went wrong. Please try again.")
      }
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center align-middle sm:px-6 lg:px-8 mt-0">


    <div className=" mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
      <div className="bg-[#1B2559] px-0 py-0 pb-12 mb-4 shadow sm:rounded-lg sm:px-12 border-blue-600 border">'   
      <h1 className="text-[#43A7C5]  text-center font-semibold font-mono text-3xl mb-8">
            Create Your Account
          </h1>
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <Alert variant="destructive" className="bg-red-900 border-red-600 text-white">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="mb-4">
              <Label htmlFor="firstName" className="text-shadow-lg text-shadow-gray-200 block text-lg font-mono font-semibold leading-6 text-gray-200 pb-1">
                First Name
              </Label>
              <div className="mt-2">
                <Input
                  id="firstName"
                  placeholder='Enter your first name'
                  name="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-[#111c44] w-full rounded-md p-1.5 text-white focus:border-white border-gray-400 border placeholder:text-gray-600 sm:text-sm sm:leading-6 pt-1"
                />
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="lastName" className="text-shadow-lg text-shadow-gray-200 block text-lg font-mono font-semibold leading-6 text-gray-200 pb-1">
                Last Name
              </Label>
              <div className="mt-2">
                <Input
                  id="lastName"
                  placeholder='Enter your last name'
                  name="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-[#111c44] w-full rounded-md p-1.5 text-white focus:border-white border-gray-400 border placeholder:text-gray-600 sm:text-sm sm:leading-6 pt-1"
                />
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="email" className="text-shadow-lg text-shadow-gray-200 block text-lg font-mono font-semibold leading-6 text-gray-200 pb-1">
                Email address
              </Label>
              <div className="mt-2">
                <Input
                  id="email"
                  placeholder='Enter your email address'
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#111c44] w-full rounded-md p-1.5 text-white focus:border-white border-gray-400 border placeholder:text-gray-600 sm:text-sm sm:leading-6 pt-1"
                />
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="password" className="block text-lg font-mono font-semibold leading-6 text-gray-200 p-1.5 rounded-md">
                Password
              </Label>
              <div className="mt-2">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder='Enter your password'
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#111c44] border focus:border-white border-gray-400 text-white placeholder:text-gray-600 pt-1"
                />
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="confirmPassword" className="block text-lg font-mono font-semibold leading-6 text-gray-200 p-1.5 rounded-md">
                Confirm Password
              </Label>
              <div className="mt-2">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder='Confirm your password'
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#111c44] border focus:border-white border-gray-400 text-white placeholder:text-gray-600 pt-1"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-700 font-semibold leading-6 text-white shadow-sm hover:bg-green-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 outline-green-600 focus-visible:outline-black w-full"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 
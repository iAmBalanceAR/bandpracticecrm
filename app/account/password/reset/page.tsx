'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
export default function PasswordResetPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isTestMode = searchParams.get('test') === 'layout'
  const supabase = createClient()

  useEffect(() => {
    async function checkSession() {
      // Skip session check if in test mode
      if (isTestMode) {
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/signin?error=reset_code_invalid')
        return
      }
      setLoading(false)
    }
    checkSession()
  }, [router, supabase.auth, isTestMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // In test mode, just show what would happen
    if (isTestMode) {
      if (password !== confirmPassword) {
        setError("Passwords don't match")
      } else {
        router.push('/auth/signin?message=Password updated successfully')
      }
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      router.push('/auth/signin?message=Password updated successfully')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-lg shadow p-6">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="">
          {isTestMode && (
            <div className="text-yellow-500 text-sm mb-4 p-2 bg-yellow-500/10 rounded">
              Test Mode Active - No actual password changes will be made
            </div>
          )}
            <Image 
                src="/images/logo-full.png" 
                alt="logo" 
                width={863} 
                height={160}
                className="mx-auto p-8"
           />
         <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[500px]">
             <div className="bg-[#1B2559] px-0 py-0 pb-12 mb-4 shadow sm:rounded-lg sm:px-4 border-blue-600 border">         
                <h1 className="text-[#43A7C5] text-center font-semibold font-mono text-3xl mb-4 mt-4">
                    Reset Your Password
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                    {/* <label htmlFor="password" className="">
                        New Password
                    </label> */}
                    <input
                        type="password"
                        placeholder='Enter Your New Password...'
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                         className="bg-[#111c44] w-full rounded-md text-white focus:border-white border-gray-400 border placeholder:text-gray-300 sm:text-md sm:leading-6 p-4"
                        required
                    />
                    </div>
                    <div>
                    {/* <label htmlFor="confirmPassword" className="6">
                        Confirm New Password 
                    </label> */}
                    <input
                        type="password"
                        id="confirmPassword"
                        placeholder='Confirm Your New Password...'
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-[#111c44] w-full rounded-md text-white focus:border-white border-gray-400 border placeholder:text-gray-300 sm:text-md sm:leading-6 p-4"
                        required
                    />
                    </div>


                    {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                    )}
                    <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-700 font-semibold text-white shadow-sm rounded-md hover:bg-green-800 focus-visible:outline outline-black p-4"
                    >
                    {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
             </div>
        </div>
    </div>
  )
} 
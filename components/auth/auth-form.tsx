'use client'

import React from 'react'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Github } from 'lucide-react'
import { useMobile } from '@/components/providers/mobile-provider'
import type { Database } from '@/types/supabase'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()
  const { isMobile, isTouchDevice } = useMobile()

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'facebook') => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) throw error
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center">
      <Card className="mx-auto w-full max-w-sm mobile:max-w-full mobile:mx-4 p-8 mobile:p-6">
        <CardContent className="space-y-4">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full h-12 mobile:h-14 text-lg mobile:text-base ${
                  isTouchDevice ? 'touch-manipulation' : ''
                }`}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full h-12 mobile:h-14 text-lg mobile:text-base ${
                  isTouchDevice ? 'touch-manipulation' : ''
                }`}
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 mobile:h-14 text-lg mobile:text-base"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              className={`h-12 mobile:h-14 text-lg mobile:text-base ${
                isTouchDevice ? 'touch-manipulation' : ''
              }`}
              onClick={() => handleOAuthSignIn('github')}
              disabled={loading}
            >
              <Github className="mr-2 h-5 w-5" />
              Github
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="mt-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
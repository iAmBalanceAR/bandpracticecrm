import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { normalizeEmail } from '@/utils/email-validator'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ exists: false })
    }

    // Normalize the email to handle case sensitivity and gmail dots
    const normalizedEmail = normalizeEmail(email)
    console.log(`Checking if email exists: ${email} (normalized: ${normalizedEmail})`)

    const supabase = createClient()
    
    // Check the profiles table with normalized email
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    const exists = !!profileData
    
    console.log('Email check result:', { 
      email: normalizedEmail, 
      exists, 
      error: profileError?.message 
    })
    
    return NextResponse.json({ exists })
  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json({ exists: false, error: 'Error checking email' })
  }
} 
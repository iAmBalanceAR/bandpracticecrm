import { createClient } from '@/utils/supabase/client'

export function normalizeEmail(email: string): string {
  // Convert to lowercase
  email = email.toLowerCase()
  
  // Check if it's a Gmail address
  if (email.endsWith('@gmail.com')) {
    // Get the part before @gmail.com
    const [localPart] = email.split('@')
    
    // Remove dots
    const withoutDots = localPart.replace(/\./g, '')
    
    // Remove anything after + if it exists
    const withoutPlus = withoutDots.split('+')[0]
    
    return `${withoutPlus}@gmail.com`
  }
  
  return email
}

export async function isEmailAvailable(email: string): Promise<{ 
  available: boolean; 
  normalizedEmail: string;
  message?: string 
}> {
  const normalizedEmail = normalizeEmail(email)
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) {
      throw error
    }

    // If we found a user, the email is not available
    if (data) {
      return {
        available: false,
        normalizedEmail,
        message: 'This email address (or a variation of it) is already registered.'
      }
    }

    // Also check auth.users to be thorough
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      throw authError
    }

    const existingUser = authData.users.find(
      user => normalizeEmail(user.email || '') === normalizedEmail
    )

    if (existingUser) {
      return {
        available: false,
        normalizedEmail,
        message: 'This email address (or a variation of it) is already registered.'
      }
    }

    return {
      available: true,
      normalizedEmail
    }
  } catch (error) {
    console.error('Error checking email availability:', error)
    return {
      available: false,
      normalizedEmail,
      message: 'Unable to verify email availability. Please try again.'
    }
  }
} 
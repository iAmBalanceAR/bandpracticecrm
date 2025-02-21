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
    // Check if the email exists in the auth.users table using admin API
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) {
      console.error('Error checking email availability:', error)
      return {
        available: false,
        normalizedEmail,
        message: 'Unable to verify email availability. Please try again.'
      }
    }

    // If no data found, email is available
    if (!data) {
      return {
        available: true,
        normalizedEmail
      }
    }

    // Email exists
    return {
      available: false,
      normalizedEmail,
      message: 'This email address is already registered. Please sign in instead.'
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
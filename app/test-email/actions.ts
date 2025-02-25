'use server'

import { createClient } from '@/utils/supabase/server'

export type TestResult = {
  message?: string;
  type?: string;
  error?: string;
}

export async function testSignUp(formData: FormData) {
  const email = formData.get('email') as string;
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'testPassword123!',
    });
    
    if (error) throw error;
    return { message: `Signup email sent to ${email}`, type: 'success' } as TestResult;
  } catch (error: any) {
    console.error('Signup Error:', error.message);
    return { error: error.message } as TestResult;
  }
}

export async function testPasswordReset(formData: FormData) {
  const email = formData.get('email') as string;
  const supabase = createClient();
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return { message: `Password reset email sent to ${email}`, type: 'success' } as TestResult;
  } catch (error: any) {
    console.error('Password Reset Error:', error.message);
    return { error: error.message } as TestResult;
  }
}

export async function testMagicLink(formData: FormData) {
  const email = formData.get('email') as string;
  const supabase = createClient();
  
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });
    
    if (error) throw error;
    return { message: `Magic link sent to ${email}`, type: 'success' } as TestResult;
  } catch (error: any) {
    console.error('Magic Link Error:', error.message);
    return { error: error.message } as TestResult;
  }
} 
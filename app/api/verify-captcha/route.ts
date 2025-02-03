import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    console.log('Received reCAPTCHA token:', token ? 'Token present' : 'No token')

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      )
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY
    console.log('Secret key present:', !!secretKey)

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    })

    const data = await response.json()
    console.log('Google reCAPTCHA response:', data)

    return NextResponse.json({
      success: data.success,
      message: data.success ? 'Verification successful' : 'Verification failed',
      error_codes: data['error-codes'] // Include error codes if any
    })
  } catch (error) {
    console.error('reCAPTCHA verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Verification failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    const verificationResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      {
        method: 'POST',
      }
    )

    const verificationData = await verificationResponse.json()

    return NextResponse.json(verificationData)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to verify reCAPTCHA' },
      { status: 500 }
    )
  }
} 
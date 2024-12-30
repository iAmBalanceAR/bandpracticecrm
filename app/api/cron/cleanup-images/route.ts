import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const cleanupResponse = await fetch(new URL('/api/cleanup-images', request.url), {
      method: 'POST',
    })

    if (!cleanupResponse.ok) {
      throw new Error(`Cleanup failed: ${await cleanupResponse.text()}`)
    }

    const result = await cleanupResponse.json()

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 
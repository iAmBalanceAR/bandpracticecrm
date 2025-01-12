import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Endpoint removed' }, { status: 404 })
}

export async function POST() {
  return NextResponse.json({ error: 'Endpoint removed' }, { status: 404 })
}

// Define runtime config to ensure proper handling
export const runtime = 'edge' 
import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST() {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts/stripe-sync.mjs')
    
    const child = spawn('node', [scriptPath], {
      env: {
        ...process.env,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    })

    let output = ''
    child.stdout.on('data', (data) => (output += data))
    child.stderr.on('data', (data) => (output += data))

    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        code === 0 ? resolve(output) : reject(output)
      })
    })

    return NextResponse.json({ output })
  } catch (error) {
    return NextResponse.json(
      { error: `Script failed: ${error}` },
      { status: 500 }
    )
  }
}

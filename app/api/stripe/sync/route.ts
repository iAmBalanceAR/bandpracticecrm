import { syncStripeProducts } from '@/utils/stripe/sync'

export async function POST(req: Request) {
  try {
    const result = await syncStripeProducts()
    
    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Failed to sync Stripe data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 
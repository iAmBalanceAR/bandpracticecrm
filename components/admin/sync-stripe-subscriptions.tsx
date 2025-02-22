'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function SyncStripeSubscriptions() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string|null>(null)

  const handleSync = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/sync-subscriptions', {
        method: 'POST'
      })
      const data = await res.json()
      setMessage(JSON.stringify(data, null, 2))
    } catch (error) {
      setMessage('Subscription sync failed - Check server logs')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 border rounded-lg bg-gray-900 border-gray-700">
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSync}
          disabled={isLoading}
          variant="outline"
          className="text-white bg-blue-600 hover:bg-blue-700 border-blue-700"
        >
          {isLoading ? 'Syncing...' : 'Sync Stripe Subscriptions'}
        </Button>
        {message && (
          <pre className="mt-4 p-4 bg-black text-green-400 text-xs overflow-auto max-h-96">
            {message}
          </pre>
        )}
      </div>
    </div>
  )
}
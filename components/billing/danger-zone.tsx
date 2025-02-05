"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircle } from 'lucide-react'

interface DangerZoneProps {
  customerStripeId: string
  subscriptionEndDate: string
  onCancel: (formData: FormData) => void
}

export function DangerZone({ customerStripeId, subscriptionEndDate, onCancel }: DangerZoneProps) {
  const [confirmCancel, setConfirmCancel] = useState('')
  const [showDangerZone, setShowDangerZone] = useState(false)
  const CANCEL_CONFIRMATION = 'CANCEL SUBSCRIPTION'

  if (!showDangerZone) {
    return (
      <div className="mt-4 flex justify-end">
        <Button
          variant="destructive"
          onClick={() => setShowDangerZone(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Cancel Subscription
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 bg-gray-300 rounded-lg border-red-800/50 border">
      <div className="space-y-4">
        <div className="border-b border-red-800/30 pb-3 flex justify-between items-center">
          <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDangerZone(false)}
            className="text-gray-700 hover:text-gray-900 hover:bg-gray-400/20"
          >
            Cancel
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Cancel Subscription</p>
              <p className="text-xs text-gray-700 mt-1">
                This will cancel your subscription at the end of the current billing period. 
                You will continue to have access until {subscriptionEndDate}.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              To confirm cancellation, type <span className="font-mono text-red-600">{CANCEL_CONFIRMATION}</span> below:
            </p>
            <Input
              type="text"
              value={confirmCancel}
              onChange={(e) => setConfirmCancel(e.target.value)}
              className="bg-white border-red-800/30 text-black w-full max-w-md"
              placeholder="Type to confirm"
            />
            <form action={onCancel}>
              <input type="hidden" name="customerStripeId" value={customerStripeId} />
              <Button 
                type="submit"
                variant="destructive"
                className="border border-red-800 bg-red-900/30 hover:bg-red-900/50 mt-2 text-white"
                disabled={confirmCancel !== CANCEL_CONFIRMATION}
              >
                Cancel Subscription
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 
"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircle, X } from 'lucide-react'

interface DangerZoneProps {
  customerStripeId: string
  subscriptionEndDate: string
  onCancel: (formData: FormData) => void
}

export function DangerZone({ customerStripeId, subscriptionEndDate, onCancel }: DangerZoneProps) {
  console.log('Debug - Danger Zone Props:', { customerStripeId, subscriptionEndDate })
  
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
          <AlertCircle className="w-4 h-8 mr9 flex" />
          <span className="flex text-shadow-sm -text-shadow-x-2 text-shadow-y-2">Cancel Subscription</span>
        </Button>
      </div>

    )
  }

  return (
    <div className=" bg-neutral-300 rounded-lg border-orange-400 border-2 mt-4">
      <div className="space-y-4">
        <div className="pt-4 pb-4 p-4 bg-red-600 border-b-2 border-lime-500   flex justify-between items-center">

          <h3 className=" font-mediu text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black font-mono font-bold text-3xl text-yellow-400">Danger Zone</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDangerZone(false)}
            className="text-white bg-orange-400 hover:bg-orange-300 border-red-700 border"
          >
          <span className="flex font-bold">
            <X className="w-26 h-26 text-red-700 font-bold flex mr-2 ml-2" />
            </span>
          </Button>
        </div>
        <div className="space-y-4">
          <div className="px-4 flex items-center justify-between">
            <div>
              <p className="text-2xl  text-black font-bold text-shadow-red-600 text-shadow-sm -text-shadow-x-1 text-shadow-y-1">Cancel Subscription</p>
              <p className="text-lg text-slate-800 mt-1">
                This will cancel your subscription at the end of the current billing period. 
                You will continue to have access until {subscriptionEndDate}.
              </p>
            </div>
          </div>

          <div className="space-y-3 px-4">
            <p className="text-lg text-black">
              To confirm cancellation, type <span className="font-mono text-red-600 font-bold">{CANCEL_CONFIRMATION}</span> below:
            </p>
            <div className="flex-1">
            <Input
              type="text"
              value={confirmCancel}
              onChange={(e) => setConfirmCancel(e.target.value)}
              className="flex bg-white border-red-800/30 text-black w-full max-w-md"
              placeholder="Type to confirm"
            />
            </div>
            <div className="flex-1">
            <form action={onCancel} className="pb-4">
              <input type="hidden" name="customerStripeId" value={customerStripeId} />
              <Button 


                type="submit"
                variant="destructive"
                className=" border border-red-800 bg-red-600 hover:bg-yellow-400  mt-2 text-yellow-200 "
                disabled={confirmCancel !== CANCEL_CONFIRMATION}
              >
                <span className='text-md text-shadow-sm -text-shadow-x-1 text-shadow-y-1'>Cancel Subscription</span>

              </Button>
            </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
'use client'

import { Button } from "@/components/ui/button"
import { useState } from "react"

export function VenueCleanup() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const handleCleanup = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/cleanup-venues', {
        method: 'POST',
      })
      const data = await response.json()
      setResult(data.message)
    } catch (error) {
      setResult('Cleanup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleCleanup} 
        disabled={isLoading}
      >
        {isLoading ? 'Cleaning up...' : 'Clean up Duplicate Venues'}
      </Button>
      {result && <p>{result}</p>}
    </div>
  )
} 
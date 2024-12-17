'use client'

import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert" className="p-4 bg-destructive/10 text-destructive rounded-md">
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm mb-4">An error occurred while rendering this page:</p>
      <pre className="p-4 bg-black/10 rounded-md overflow-auto text-sm">
        {error.message}
      </pre>
    </div>
  )
}

export function ClientErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      {children}
    </ErrorBoundary>
  )
} 
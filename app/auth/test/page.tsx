// Simple test page in the auth directory
export default function AuthTest() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-8">Auth Test Page</h1>
      <p className="text-xl mb-4">If you can see this, pages in the auth directory are loading correctly.</p>
      <div className="p-4 bg-green-100 rounded-lg">
        <p>This is a test page to debug auth directory loading issues.</p>
      </div>
    </div>
  )
} 
// Auth layout with proper styling
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1"> {children} </main>
    </div>
  )
} 
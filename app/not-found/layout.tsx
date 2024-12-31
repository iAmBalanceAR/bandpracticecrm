export default function NotFoundLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0f1729]">
      {children}
    </div>
  )
} 
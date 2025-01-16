import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'View and manage your account information and activity overview.'
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 
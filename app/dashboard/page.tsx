import { Metadata } from 'next'
import ProgressiveDashboard from '@/components/progressive-dashboard'

export const metadata: Metadata = {
  title: 'Dashboard | Band Practice',
  description: 'View your band dashboard with all your important information in one place.',
}

export default function DashboardPage() {
  return <ProgressiveDashboard />
} 
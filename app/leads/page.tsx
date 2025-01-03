import { Metadata } from 'next';
import LeadsLayout from './leads-layout';

export const metadata: Metadata = {
  title: 'Lead Management',
  description: 'Manage and track your leads effectively',
};

export default function LeadsPage() {
  return <LeadsLayout />;
} 
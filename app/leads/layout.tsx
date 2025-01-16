import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lead Management',
  description: 'Manage and track your leads effectively',
};

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 
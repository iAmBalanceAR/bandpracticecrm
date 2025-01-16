import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Venue Database',
  description: 'Search and manage venue information',
};

export default function VenuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 
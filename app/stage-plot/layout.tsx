import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stage Plot Generator',
  description: 'Create and manage stage plots for your performances',
};

export default function StagePlotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 
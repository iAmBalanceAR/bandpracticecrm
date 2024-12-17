interface FormMessageProps {
  type?: 'error' | 'success';
  children: React.ReactNode;
}

export default function FormMessage({ type = 'error', children }: FormMessageProps) {
  const className = type === 'error' ? 'text-red-500' : 'text-green-500';
  return <div className={className}>{children}</div>;
} 
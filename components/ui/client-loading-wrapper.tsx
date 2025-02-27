'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ClientLoadingWrapperProps {
  children: ReactNode;
  delay?: number; // Delay in milliseconds
}

/**
 * A wrapper component that only renders its children after a specified delay 
 * once the component has mounted on the client side. Useful for delaying
 * components that might cause auth or API operations on initial load.
 */
export function ClientLoadingWrapper({ 
  children, 
  delay = 2000 // Default delay of 2 seconds 
}: ClientLoadingWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Set a timeout to delay rendering children
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, delay);

    // Clear timeout on component unmount
    return () => clearTimeout(timer);
  }, [delay]);

  // Don't render anything until the delay has passed
  if (!isMounted) return null;

  // Render children after the delay
  return <>{children}</>;
} 
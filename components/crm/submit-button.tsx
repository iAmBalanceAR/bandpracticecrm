'use client';

import React from 'react';
import { Button } from "@/components/ui/button"

interface SubmitButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function SubmitButton({ 
  children, 
  isLoading = false, 
  onClick,
  className = '' 
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isLoading}
      onClick={onClick}
      className={className}
    >
      {isLoading ? 'Loading...' : children}
    </Button>
  );
} 
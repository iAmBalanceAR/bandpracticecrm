'use client';

import { useEffect, useState } from 'react';
import createClient from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export function useAuthQuery<T>() {
  const supabase = createClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const executeQuery = async (queryBuilder: any) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: result, error: queryError } = await queryBuilder();
      
      if (queryError) throw queryError;
      
      setData(result || []);
      return result;
    } catch (err: any) {
      setError(err);
      console.error('Query error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    executeQuery,
    data,
    isLoading,
    error,
    setData
  };
} 
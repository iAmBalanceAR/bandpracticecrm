import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useSupabase() {
  const [client] = useState(() => supabase);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Handle auth state changes if needed
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { supabase: client };
}
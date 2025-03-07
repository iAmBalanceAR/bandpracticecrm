import { useState, useEffect, useRef } from 'react';
import createClient from '@/utils/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Debounce time in milliseconds
const DEBOUNCE_TIME = 2000;
// Maximum retry attempts
const MAX_RETRIES = 3;

export function useAuthWithDebounce() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use refs to track retry attempts and debounce timer
  const retryCount = useRef(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Function to get session with debouncing
  const getSessionDebounced = () => {
    // Clear any existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set a new timer
    debounceTimer.current = setTimeout(async () => {
      try {
        // If we've exceeded max retries, stop trying
        if (retryCount.current >= MAX_RETRIES) {
          console.warn('Max auth retry attempts reached, stopping auth checks');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          setError(error);
          retryCount.current++;
        } else {
          setSession(data.session);
          setUser(data.session?.user || null);
          retryCount.current = 0; // Reset retry count on success
        }
      } catch (err) {
        console.error('Unexpected auth error:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        retryCount.current++;
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_TIME);
  };

  useEffect(() => {
    // Initial session check
    getSessionDebounced();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // Clean up
    return () => {
      subscription.unsubscribe();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return { user, session, loading, error };
}

export default useAuthWithDebounce; 
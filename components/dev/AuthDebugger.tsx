'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { clearAuthState } from '@/utils/dev-auth-reset';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { useSupabase } from '@/components/providers/supabase-client-provider';
// Import as type only to avoid runtime issues
import type RequestMonitor from '@/utils/dev-request-monitor';

// Safely import the request monitor at runtime
let requestMonitor: any = null;
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Dynamic import to avoid SSR issues
  import('@/utils/dev-request-monitor').then(module => {
    requestMonitor = module.default;
  }).catch(err => {
    console.error('Failed to load request monitor:', err);
  });
}

/**
 * A development-only component that displays auth state and provides debugging tools
 * Only renders in development mode
 */
const AuthDebugger: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>('Never');
  const [checkCount, setCheckCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [recentRequestCount, setRecentRequestCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Use the existing Supabase context instead of creating a new client
  const { supabase } = useSupabase();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        setSession(session);
        setLastCheckTime(new Date().toLocaleTimeString());
        setCheckCount(prev => prev + 1);
      }
    );

    // Initial check
    supabase.auth.getSession().then((response) => {
      const { data } = response;
      setUser(data.session?.user ?? null);
      setSession(data.session);
      setLastCheckTime(new Date().toLocaleTimeString());
      setCheckCount(prev => prev + 1);
    });

    // Set up request monitor listener
    let unsubscribeMonitor: (() => void) | undefined;
    
    // Function to update request counts
    const updateRequestCounts = () => {
      if (requestMonitor) {
        try {
          if (typeof requestMonitor.getTotalCount === 'function') {
            setRequestCount(requestMonitor.getTotalCount());
          }
          if (typeof requestMonitor.getRecentCount === 'function') {
            setRecentRequestCount(requestMonitor.getRecentCount());
          }
        } catch (error) {
          console.error('Error updating request counts:', error);
        }
      }
    };
    
    // Initial update
    updateRequestCounts();
    
    // Set up interval to update counts
    const intervalId = setInterval(updateRequestCounts, 1000);
    
    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
      if (unsubscribeMonitor && typeof unsubscribeMonitor === 'function') {
        try {
          unsubscribeMonitor();
        } catch (error) {
          console.error('Error unsubscribing from request monitor:', error);
        }
      }
    };
  }, []);

  const handleClearAuth = () => {
    clearAuthState();
    setUser(null);
    setSession(null);
    setLastCheckTime(new Date().toLocaleTimeString() + ' (cleared)');
    window.location.reload();
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed state - just show a button */}
      {isCollapsed ? (
        <Button 
          onClick={toggleCollapse}
          className="bg-slate-800 text-white hover:bg-slate-700"
          size="sm"
        >
          Auth Debug {recentRequestCount > 0 && `(${recentRequestCount})`}
        </Button>
      ) : (
        /* Expanded state - show full debugger */
        <div className="p-4 bg-slate-800 text-white rounded-lg shadow-lg max-w-md max-h-[80vh] overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">Auth Debugger</h3>
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleClearAuth}
              >
                Clear Auth
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleCollapse}
                className="text-white border-white hover:bg-slate-700"
              >
                Collapse
              </Button>
            </div>
          </div>
          
          <div className="text-xs mb-2">
            <div className="flex justify-between">
              <span>Last check:</span>
              <span>{lastCheckTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Total checks:</span>
              <span>{checkCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Total requests:</span>
              <span>{requestCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Requests (last minute):</span>
              <span>{recentRequestCount}</span>
            </div>
          </div>

          <div className="text-xs">
            <h4 className="font-semibold mb-1">Session:</h4>
            <pre className="bg-slate-900 p-2 rounded overflow-auto max-h-32">
              {session ? JSON.stringify(session, null, 2) : 'No session'}
            </pre>
            
            <h4 className="font-semibold mb-1 mt-2">User:</h4>
            <pre className="bg-slate-900 p-2 rounded overflow-auto max-h-32">
              {user ? JSON.stringify(user, null, 2) : 'No user'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthDebugger; 
/**
 * Utility functions for resetting auth state in development mode
 * These functions should only be used during development
 */

/**
 * Clears all Supabase-related storage (localStorage and cookies)
 * This can help resolve auth token issues during development
 */
export const clearAuthState = (): void => {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    console.warn('Auth reset utilities should only be used in development mode');
    return;
  }

  // Clear localStorage items
  const keysToRemove = [
    'supabase.auth.token',
    'supabase.auth.refreshToken',
    'supabase.auth.expires_at',
    'supabase.auth.expires_in',
    'supabase.auth.provider_token',
    'supabase.auth.provider_refresh_token',
    'supabase.auth.user',
    'supabase.auth.session',
  ];

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove ${key} from localStorage:`, e);
    }
  });

  // Clear all cookies related to Supabase
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.trim().split('=');
    if (name.includes('supabase') || name.includes('sb-')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });

  console.log('Auth state cleared. Please refresh the page.');
};

export default clearAuthState; 
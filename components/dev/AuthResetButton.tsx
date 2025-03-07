'use client'

import React from 'react';
import clearAuthState from '@/utils/dev-auth-reset';

/**
 * Development component that can be added to pages for easy auth reset
 * Only renders in development mode
 */
const AuthResetButton: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      className="fixed bottom-2 right-2 z-50 bg-red-500 text-white px-3 py-2 rounded text-xs cursor-pointer shadow-md hover:bg-red-600 transition-colors"
      onClick={clearAuthState}
    >
      Reset Auth
    </div>
  );
};

export default AuthResetButton; 
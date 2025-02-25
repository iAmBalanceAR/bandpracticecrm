'use client';

import { useState } from 'react';
import { testSignUp, testPasswordReset, testMagicLink, type TestResult } from './actions';

const initialState: TestResult = {
  message: '',
  type: '',
  error: ''
};

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<TestResult>(initialState);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Test Supabase Email Settings</h1>
      
      <div className="w-full max-w-md space-y-4">
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter test email address"
          />
        </div>

        {(result.message || result.error) && (
          <div className={`p-4 rounded-md mb-4 ${result.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {result.error || result.message}
          </div>
        )}

        <div className="space-y-4">
          <form 
            action={async (formData) => {
              const result = await testSignUp(formData);
              setResult(result);
            }}
          >
            <input type="hidden" name="email" value={email} />
            <button 
              type="submit"
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={!email}
            >
              Test Sign Up Email
            </button>
          </form>

          <form 
            action={async (formData) => {
              const result = await testPasswordReset(formData);
              setResult(result);
            }}
          >
            <input type="hidden" name="email" value={email} />
            <button 
              type="submit"
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
              disabled={!email}
            >
              Test Password Reset Email
            </button>
          </form>

          <form 
            action={async (formData) => {
              const result = await testMagicLink(formData);
              setResult(result);
            }}
          >
            <input type="hidden" name="email" value={email} />
            <button 
              type="submit"
              className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50"
              disabled={!email}
            >
              Test Magic Link Email
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 
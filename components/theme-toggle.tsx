'use client';

import * as React from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from '@/lib/providers/theme-provider';

interface ThemeToggleProps {
  align?: 'start' | 'center' | 'end';
}

export function ThemeToggle({ align = 'center' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted-foreground">Theme</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme('light')}
          className={`flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground ${
            theme === 'light' ? 'bg-accent text-accent-foreground' : ''
          }`}
          aria-label="Light mode"
        >
          <Sun className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground ${
            theme === 'dark' ? 'bg-accent text-accent-foreground' : ''
          }`}
          aria-label="Dark mode"
        >
          <Moon className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground ${
            theme === 'system' ? 'bg-accent text-accent-foreground' : ''
          }`}
          aria-label="System theme"
        >
          <Laptop className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 
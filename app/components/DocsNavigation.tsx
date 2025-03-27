'use client';

import React from 'react';
import Link from 'next/link';

interface NavigationItem {
  title: string;
  path: string;
  children?: NavigationItem[];
}

interface DocsNavigationProps {
  items: NavigationItem[];
}

export function DocsNavigation({ items }: DocsNavigationProps) {
  return (
    <nav className="w-full py-8 px-4">
      <ul className="space-y-2">
        {items?.map((item, index) => (
          <li key={index}>
            <Link 
              href={item.path}
              className="text-gray-200 hover:text-white transition-colors"
            >
              {item.title}
            </Link>
            {item.children && (
              <ul className="ml-4 mt-2 space-y-2">
                {item.children.map((child, childIndex) => (
                  <li key={childIndex}>
                    <Link 
                      href={child.path}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {child.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
} 
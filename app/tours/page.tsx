'use client';

import { useEffect } from 'react';
import TourList from '@/components/crm/tours/tour-list';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function ToursPage() {
  const router = useRouter();

  return (
    <div className="pl-4 pt-3 bg-[#0f1729] text-white min-h-screen">
      <h1 className="text-4xl font-mono mb-3">
        <span className="w-[100%] text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          Tour Management
        </span>
      </h1>
      <div className="border-[#008ffb] border-b-2 -mt-7 mb-8 w-[100%] h-4"></div>
      
      <div className="pr-6 pl-8 pb-6 pt-4 bg-[#131d43] text-white min-h-[500px] shadow-sm shadow-green-400 rounded-md border-blue-800 border">
        <TourList />
      </div>
    </div>
  );
} 
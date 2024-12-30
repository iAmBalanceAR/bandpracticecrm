import React from 'react';
import { cn } from '@/lib/utils';

interface CustomCardProps {
  title: string;  
  addclassName?: string;
  cardColor?: string;
  children: React.ReactNode;
}

const CustomCard: React.FC<CustomCardProps> = ({ 
  title, 
  children, 
  addclassName = '', 
  cardColor = 'white' 
}) => {
  // Handle both bracket notation colors and regular colors
  const textColorClass = cardColor.startsWith('[') ? 
    `text-${cardColor}` : 
    `text-${cardColor}`;

  return (
    <div className="p-0 m-0 w-full">
      <h2 className={cn(
        "text-3xl font-mono text-shadow-sm shadow-black",
        textColorClass
      )}>
        {title} 
      </h2>
      <div className="h-[1px] -mt-1 mb-2 bg-slate-700">&nbsp;</div>
      <div className={cn(
        "bg-[#111C44] border text-white rounded-lg border-slate-600",
        addclassName
      )}>
        <div className="m-2">
          <div className="w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomCard; 
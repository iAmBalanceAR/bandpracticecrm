import React from 'react';

interface CustomCardProps {
  title: string;  
  addclassName?: string;
  cardColor?: string;
  children: React.ReactNode;
}

const CustomCard: React.FC<CustomCardProps> = ({ title, children, addclassName, cardColor }) => (
 
   <>
   <div className='p-0m-0o c w-full'>
      <h2 className={`text-${cardColor} text-shadow-sm shadow-black text-3xl font-mono`}>
        {title} 
      </h2>
      <div className={`-mt-1 h-[1px] hidden mb-2 bg-${cardColor || 'slate-700'}`}>&nbsp;</div>
      <div className={`bg-[#111C44] border text-white rounded-lg border-slate-600 ${addclassName}`}>
      <div className="m-2 f">
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  </div>
  </>
);

export default CustomCard; 
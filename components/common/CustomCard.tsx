import React from 'react';

interface CustomCardProps {
  title: string;  
  addclassName?: string;
  cardColor?: string;
  children: React.ReactNode;
}

const CustomCard: React.FC<CustomCardProps> = ({ title, children, addclassName, cardColor }) => (
  <>
    <div className='p-0 m-0 w-full'>
      <h2 className={`text${cardColor ? `-${cardColor}` : '-[#ff9920]'} text-shadow-sm text-3xl font-mono`}>
        {title} 
      </h2>
      <div className={`h-[1px] -mt-1 mb-4 bg${cardColor ? `-${cardColor}` : '-[#ff9920]'}`}>&nbsp;</div>
      <div className={`bg-[#111C44] text-white shadow-[1px_1px_3px_2px_rgba(0,0,0,0.1)] p-2 shadow-green-400 rounded-md ${addclassName}`}>
        <div className="m-2">
          <div className="w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  </>
);

export default CustomCard; 
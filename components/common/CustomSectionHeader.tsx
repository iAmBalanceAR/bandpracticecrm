import React from 'react';

interface CustomSectionHeaderProps {
  title: string;  
  addclassName?: string;
  underlineColor?: string;
  children: React.ReactNode;
}

const CustomSectionHeader: React.FC<CustomSectionHeaderProps> = ({ title, children, addclassName, underlineColor }) => (

    <div className="pl-4 pr-4 pt-3 pb-6 bg-[#0f1729] text-white">
      <h1 className="text-4xl font-mono mb-3">
        <span className="w-[100%]  text-white text-shadow-sm font-mono text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
         {title}
        </span>
      </h1>
      <div className="border-[#008ffb] border-b-2 -mt-7 mb-8 w-[100%] h-4"></div>
        <div className={` bg-[${underlineColor}] text-white min-h-[500px]  shadow-sm shadow-green-400 rounded-md  border-blue-800 border ${addclassName}`}>
      <div className="p-0 m-0">
            {children}
        </div> 
    </div> 
    </div>
);
 export default CustomSectionHeader; 
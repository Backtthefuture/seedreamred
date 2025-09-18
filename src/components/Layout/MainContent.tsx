import React from 'react';

interface MainContentProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export const MainContent: React.FC<MainContentProps> = ({
  leftPanel,
  rightPanel,
}) => {
  return (
    <div className="flex flex-1 h-full">
      {/* 左侧输入区 */}
      <div className="w-2/5 min-w-[400px] max-w-[600px] bg-white border-r border-gray-200 flex flex-col">
        {leftPanel}
      </div>
      
      {/* 右侧预览生成区 */}
      <div className="flex-1 bg-gray-50 overflow-hidden">
        {rightPanel}
      </div>
    </div>
  );
};
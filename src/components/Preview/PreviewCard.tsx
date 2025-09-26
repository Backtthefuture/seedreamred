import React from 'react';
import { Tag } from 'antd';
import type { SplitResult } from '../../types';

interface PreviewCardProps {
  result: SplitResult;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({ result }) => {
  const isCover = result.type === 'cover';
  
  return (
    <div className="p-3 border border-gray-200 rounded-md hover:border-blue-400 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <Tag color={isCover ? 'red' : 'blue'}>
          {isCover ? '📌 封面' : `📄 内容${result.index}`}
        </Tag>
        <span className="text-xs text-gray-500">{result.charCount}字</span>
      </div>
      <div className="text-sm text-gray-700 line-clamp-3">
        {result.text}
      </div>
    </div>
  );
};
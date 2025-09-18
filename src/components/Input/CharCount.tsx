import React from 'react';
import { MIN_TEXT_LENGTH } from '../../utils/constants';

interface CharCountProps {
  count: number;
}

export const CharCount: React.FC<CharCountProps> = ({ count }) => {
  const isValid = count >= MIN_TEXT_LENGTH;
  
  return (
    <div className="px-4 py-2 border-t border-gray-200">
      <span className={`text-sm ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
        字数: {count}
        {!isValid && ` / ${MIN_TEXT_LENGTH} (最少${MIN_TEXT_LENGTH}字)`}
      </span>
    </div>
  );
};
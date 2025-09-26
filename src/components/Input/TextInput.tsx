import React from 'react';
import { Input } from 'antd';
import { MIN_TEXT_LENGTH } from '../../utils/constants';

const { TextArea } = Input;

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex-1 p-4">
      <div className="mb-2">
        <label className="text-sm font-medium text-gray-700">
          输入文本内容
        </label>
      </div>
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`在这里粘贴或输入你的文本内容...\n最少需要${MIN_TEXT_LENGTH}字`}
        disabled={disabled}
        className="h-full resize-none"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};
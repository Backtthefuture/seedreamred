import React, { useState, useEffect } from 'react';
import { Tag, Button, Input } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import type { SplitResult } from '../../types';

const { TextArea } = Input;

interface EditablePreviewCardProps {
  result: SplitResult;
  index: number;
  onUpdate: (index: number, text: string) => void;
}

export const EditablePreviewCard: React.FC<EditablePreviewCardProps> = ({ 
  result, 
  index,
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(result.text);
  const [charCount, setCharCount] = useState(result.charCount);

  useEffect(() => {
    setEditText(result.text);
    setCharCount(result.text.length);
  }, [result.text]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(result.text);
  };

  const handleSave = () => {
    const trimmedText = editText.trim();
    if (trimmedText.length > 0) {
      onUpdate(index, trimmedText);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(result.text);
    setCharCount(result.text.length);
    setIsEditing(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setEditText(newText);
    setCharCount(newText.length);
  };

  const isCover = result.type === 'cover';

  if (isEditing) {
    return (
      <div className="p-3 border border-blue-400 rounded-md bg-blue-50">
        <div className="flex items-start justify-between mb-2">
          <Tag color={isCover ? 'red' : 'blue'}>
            {isCover ? '📌 封面' : `📄 内容${result.index}`}
          </Tag>
          <span className="text-xs text-gray-600">
            {charCount}字
          </span>
        </div>
        
        <TextArea
          value={editText}
          onChange={handleTextChange}
          autoSize={{ minRows: 3, maxRows: 8 }}
          className="mb-2"
          placeholder="请输入内容..."
        />
        
        <div className="flex justify-end gap-2">
          <Button
            size="small"
            icon={<SaveOutlined />}
            type="primary"
            onClick={handleSave}
            disabled={editText.trim().length === 0}
          >
            保存
          </Button>
          <Button
            size="small"
            icon={<CloseOutlined />}
            onClick={handleCancel}
          >
            取消
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border border-gray-200 rounded-md hover:border-blue-400 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Tag color={isCover ? 'red' : 'blue'}>
            {isCover ? '📌 封面' : `📄 内容${result.index}`}
          </Tag>
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            onClick={handleEdit}
          >
            编辑
          </Button>
        </div>
        <span className="text-xs text-gray-500">{result.charCount}字</span>
      </div>
      <div className="text-sm text-gray-700 line-clamp-3">
        {result.text}
      </div>
    </div>
  );
};
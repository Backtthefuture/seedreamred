import React, { useState, useRef } from 'react';
import { Input, Button, Space, Typography, message } from 'antd';
import { 
  AudioOutlined, 
  CopyOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import { validators } from '../../utils/validators';
import { MIN_TEXT_LENGTH } from '../../utils/constants';

const { TextArea } = Input;
const { Text } = Typography;

interface GlassInputProps {
  inputText: string;
  onTextChange: (text: string) => void;
  onNext: () => void;
}

export const GlassInput: React.FC<GlassInputProps> = ({ 
  inputText, 
  onTextChange, 
  onNext
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        onTextChange(text);
        message.success('文件已导入');
      } else {
        message.error('仅支持txt文本文件');
      }
    }
  };
  
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onTextChange(text);
      message.success('已粘贴文本');
    } catch (err) {
      message.error('粘贴失败');
    }
  };
  
  const handleClear = () => {
    onTextChange('');
  };
  
  const handleVoiceInput = () => {
    message.info('语音输入功能开发中...');
  };
  
  return (
    <div 
      className={`glass-morphism rounded-lg p-6 mb-6 animate-fadeInUp ${
        isDragging ? 'drag-over' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <TextArea
        placeholder="✍️ 在这里开始您的创作...\n\n支持直接粘贴、拖拽文件或语音输入"
        value={inputText}
        onChange={(e) => onTextChange(e.target.value)}
        rows={10}
        maxLength={10000}
        className="!bg-transparent !border-none text-base"
        style={{ resize: 'none' }}
      />
      
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Text className="text-gray-600">
            字数: {inputText.length}/10000
          </Text>
          {inputText.length < MIN_TEXT_LENGTH && inputText.length > 0 && (
            <Text type="danger" className="text-sm">
              还需输入 {MIN_TEXT_LENGTH - inputText.length} 字
            </Text>
          )}
        </div>
        
        <Space>
          <Button
            icon={<AudioOutlined />}
            onClick={handleVoiceInput}
            className="hover-glow"
            title="语音输入"
          >
            语音
          </Button>
          <Button
            icon={<CopyOutlined />}
            onClick={handlePaste}
            className="hover-glow"
          >
            粘贴
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={handleClear}
            disabled={!inputText}
            danger
          >
            清空
          </Button>
        </Space>
      </div>
      
      <div className="mt-4 text-center">
        <Button
          type="primary"
          size="large"
          onClick={onNext}
          disabled={!validators.isValidTextLength(inputText)}
          className="px-12 hover-glow"
        >
          下一步 →
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            file.text().then(text => {
              onTextChange(text);
              message.success('文件已导入');
            });
          }
        }}
      />
    </div>
  );
};
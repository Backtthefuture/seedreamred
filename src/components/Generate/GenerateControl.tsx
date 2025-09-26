import React from 'react';
import { Button } from 'antd';
import { PictureOutlined } from '@ant-design/icons';

interface GenerateControlProps {
  canGenerate: boolean;
  isGenerating: boolean;
  imageCount: number;
  onGenerate: () => void;
}

export const GenerateControl: React.FC<GenerateControlProps> = ({
  canGenerate,
  isGenerating,
  imageCount,
  onGenerate,
}) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <Button
        type="primary"
        size="large"
        icon={<PictureOutlined />}
        onClick={onGenerate}
        disabled={!canGenerate || isGenerating}
        loading={isGenerating}
        block
      >
        {isGenerating 
          ? '正在生成图片...' 
          : `立即生成所有图片 (共${imageCount}张)`}
      </Button>
    </div>
  );
};
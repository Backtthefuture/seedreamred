import React from 'react';
import { Button, Empty, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { SplitResult } from '../../types';
import { EditablePreviewCard } from './EditablePreviewCard';
import { useAppStore } from '../../stores/useAppStore';

interface SplitPreviewProps {
  splitResults: SplitResult[];
  isSplitting: boolean;
  onReSplit: () => void;
}

export const SplitPreview: React.FC<SplitPreviewProps> = ({
  splitResults,
  isSplitting,
  onReSplit,
}) => {
  const { updateSplitResult } = useAppStore();

  const handleUpdateResult = (index: number, text: string) => {
    updateSplitResult(index, text);
  };

  if (isSplitting) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-center h-64">
          <Spin size="large" tip="正在智能拆分文本..." />
        </div>
      </div>
    );
  }

  if (splitResults.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm">
        <Empty
          description="请先输入文本并点击智能拆分"
          className="py-8"
        />
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-700">AI拆分预览</h3>
        <Button
          icon={<ReloadOutlined />}
          onClick={onReSplit}
          size="small"
        >
          重新拆分
        </Button>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {splitResults.map((result, index) => (
          <EditablePreviewCard 
            key={index} 
            result={result} 
            index={index}
            onUpdate={handleUpdateResult}
          />
        ))}
      </div>
    </div>
  );
};
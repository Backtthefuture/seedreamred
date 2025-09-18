import React, { useState, useEffect } from 'react';
import { Modal, Input, Typography, Space, Button } from 'antd';
import { EditOutlined, SaveOutlined, LoadingOutlined } from '@ant-design/icons';
import type { SplitResult, GeneratedImage } from '../../types';

const { TextArea } = Input;
const { Text } = Typography;

interface TextEditModalProps {
  visible: boolean;
  splitResult: SplitResult | null;
  currentImage?: GeneratedImage;
  onSave: (newText: string) => void;
  onCancel: () => void;
}

export const TextEditModal: React.FC<TextEditModalProps> = ({
  visible,
  splitResult,
  currentImage,
  onSave,
  onCancel,
}) => {
  const [editedText, setEditedText] = useState('');
  const [charCount, setCharCount] = useState(0);

  // 初始化编辑内容
  useEffect(() => {
    if (splitResult) {
      setEditedText(splitResult.text);
      setCharCount(splitResult.text.length);
    }
  }, [splitResult]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setEditedText(newText);
    setCharCount(newText.length);
  };

  const handleSave = () => {
    if (editedText.trim()) {
      onSave(editedText.trim());
    }
  };

  if (!splitResult) return null;

  const typeLabel = splitResult.type === 'cover' ? '封面' : `内容${splitResult.index}`;
  const maxLength = splitResult.type === 'cover' ? 200 : 500;
  
  // 根据当前图片状态判断是否正在生成
  const isGenerating = currentImage?.status === 'generating';

  return (
    <Modal
      title={
        <Space>
          <EditOutlined />
          <span>编辑文本内容</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={isGenerating ? <LoadingOutlined /> : <SaveOutlined />}
          onClick={handleSave}
          loading={isGenerating}
          disabled={!editedText.trim() || charCount > maxLength || isGenerating}
        >
          {isGenerating ? '正在生成中...' : '保存并重新生成图片'}
        </Button>,
      ]}
    >
      <Space direction="vertical" className="w-full" size="large">
        <div>
          <Text strong>类型：</Text>
          <Text>{typeLabel}</Text>
        </div>

        <div>
          <TextArea
            value={editedText}
            onChange={handleTextChange}
            rows={8}
            placeholder="请输入文本内容..."
            className="resize-none"
            style={{ fontSize: '14px' }}
          />
        </div>

        <div className="flex justify-between items-center">
          <Space>
            <Text>字数：</Text>
            <Text type={charCount > maxLength ? 'danger' : undefined}>
              {charCount}/{maxLength}
            </Text>
          </Space>
          {charCount > maxLength && (
            <Text type="danger" className="text-sm">
              文本超出长度限制，请精简内容
            </Text>
          )}
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <Text type="secondary" className="text-xs">
            提示：编辑后将使用原始模板重新生成该图片，其他图片不受影响。
          </Text>
        </div>
      </Space>
    </Modal>
  );
};